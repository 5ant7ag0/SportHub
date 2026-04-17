import os
import cloudinary
import cloudinary.uploader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.models import Post, Message, Comment, Notification
from core.api.auth import MongoJWTAuthentication
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.exceptions import NotFound
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from core.api.serializers import PostSerializer

class PostCreateView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        content = request.data.get('content')
        file_obj = request.FILES.get('file')

        if not content:
            raise ValidationError("El contenido descriptivo no puede estar vacío.")

        media_url = ""
        if file_obj:
            # Detectar si Cloudinary está configurado o es Dummy
            c_url = os.environ.get('CLOUDINARY_URL', '')
            if 'dummy' in c_url.lower() or not c_url:
                # Fallback Local
                from django.core.files.storage import default_storage
                from django.conf import settings
                filename = default_storage.save(f"posts/{file_obj.name}", file_obj)
                media_url = f"{settings.MEDIA_URL}{filename}"
            else:
                try:
                    # Subida Real a Cloudinary
                    upload_data = cloudinary.uploader.upload(
                        file_obj, 
                        folder="sporthub_posts",
                        resource_type="auto"
                    )
                    media_url = upload_data.get('secure_url', '')
                    media_url = media_url.replace('/upload/', '/upload/q_auto,f_auto,w_500/')
                except Exception as e:
                    return Response({'error': f"Cloudinary Error: {str(e)}"}, status=500)

        # Captura de metadatos de Marketplace
        p_type = request.data.get('post_type', 'post')
        s_title = request.data.get('service_title')
        s_price = request.data.get('service_price')
        sp_id = request.data.get('shared_profile_id')
        
        try:
            if s_price: s_price = float(s_price)
            else: s_price = None
        except (ValueError, TypeError):
            s_price = None

        shared_profile_obj = None
        if p_type == 'profile_share' and sp_id:
            from core.models import User
            from bson import ObjectId
            try:
                shared_profile_obj = User.objects.get(id=ObjectId(sp_id))
            except:
                pass

        # Procedemos a persistir de forma ultrarrápida el documento subyacente en NoSQL
        post = Post(
            author=request.user,
            content=content,
            media_url=media_url,
            post_type=p_type,
            service_title=s_title,
            service_price=s_price,
            shared_profile=shared_profile_obj
        )
        post.save()

        # Enviar notificación de nuevo post con la data completa para fluid-feed
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from core.api.serializers import PostSerializer
            
            serializer = PostSerializer(post, context={'request': request})
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'presence', 
                {
                    'type': 'new_notification',
                    'data': {
                        'type': 'feed_update',
                        'post': serializer.data
                    }
                }
            )
        except Exception as e:
            print(f"Error enviando señal de feed: {e}")

        return Response({
            "detail": "Post creado exitósamente",
            "post": serializer.data if 'serializer' in locals() else {"id": str(post.id)},
            "optimized_media_url": media_url
        }, status=201)

class MessageWithMediaView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        body = request.data.get('body')
        file_obj = request.FILES.get('file')

        if not receiver_id or not body:
            raise ValidationError("receptor y cuerpo requeridos.")

        from core.models import User
        try:
            receiver = User.objects.get(id=ObjectId(receiver_id))
        except:
            raise NotFound("Receiver no encontrado")

        media_url = ""
        if file_obj:
            c_url = os.environ.get('CLOUDINARY_URL', '')
            if 'dummy' in c_url.lower() or not c_url:
                from django.core.files.storage import default_storage
                from django.conf import settings
                filename = default_storage.save(f"chat/{file_obj.name}", file_obj)
                media_url = f"{settings.MEDIA_URL}{filename}"
            else:
                try:
                    upload_data = cloudinary.uploader.upload(file_obj, folder="sporthub_chat", resource_type="auto")
                    media_url = upload_data.get('secure_url', '')
                except Exception as e:
                    return Response({'error': str(e)}, status=500)

        msg = Message(
            sender=request.user,
            receiver=receiver,
            body=body,
            media_url=media_url,
            unread_by=[receiver]
        )
        msg.save()

        # Actualización de Chats Activos para persistencia
        request.user.update(add_to_set__active_chats=receiver)
        receiver.update(add_to_set__active_chats=request.user)

        # Enviar notificación via WebSocket al destinatario
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from core.api.serializers import MessageSerializer
            serializer = MessageSerializer(msg)
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{receiver.id}',
                {
                    'type': 'new_notification',
                    'data': {
                        'type': 'message',
                        'message': serializer.data
                    }
                }
            )
        except Exception as e:
            print(f"WebSocket send error in media view: {e}")

        return Response({"detail": "Mensaje enviado", "media_url": media_url, "message_data": serializer.data if 'serializer' in locals() else None}, status=201)

class CommentWithMediaView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        post_id = request.data.get('post_id')
        text = request.data.get('text')
        file_obj = request.FILES.get('file')

        if not post_id or not text:
            raise ValidationError("Se requiere post_id y text.")
            
        try:
            post = Post.objects.get(id=ObjectId(post_id))
        except:
            raise NotFound("Post no encontrado.")

        media_url = ""
        if file_obj:
            c_url = os.environ.get('CLOUDINARY_URL', '')
            if 'dummy' in c_url.lower() or not c_url:
                from django.core.files.storage import default_storage
                from django.conf import settings
                filename = default_storage.save(f"comments/{file_obj.name}", file_obj)
                media_url = f"{settings.MEDIA_URL}{filename}"
            else:
                try:
                    upload_data = cloudinary.uploader.upload(file_obj, folder="sporthub_comments", resource_type="auto")
                    media_url = upload_data.get('secure_url', '')
                except Exception:
                    pass

        new_comment = Comment(author=request.user, text=text, media_url=media_url)
        post.update(push__comments=new_comment)
        
        # Trigger de Notificación Social (Privado)
        if str(post.author.id) != str(request.user.id):
            Notification(actor=request.user, recipient=post.author, action_type='comment', post_id=post).save()
        
        # 🌐 BROADCAST MUNDIAL: Notificar a todos en el feed
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from core.api.serializers import PostSerializer
            post.reload()
            serializer = PostSerializer(post)
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'presence',
                {
                    'type': 'new_notification',
                    'data': {
                        'type': 'post_update',
                        'post': serializer.data
                    }
                }
            )
        except Exception as e:
            print(f"WS upload broadcast error: {e}")

        return Response({"message": "Comentario agregado.", "media_url": media_url}, status=201)

class PostShareView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post_id')
        comment = request.data.get('content', '') # Comentario opcional al compartir
        
        if not post_id:
            raise ValidationError("ID de post original requerido.")
            
        try:
            original_post = Post.objects.get(id=ObjectId(post_id))
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post original no encontrado.")

        # Creamos el Repost
        repost = Post(
            author=request.user,
            content=comment if comment else original_post.content,
            is_repost=True,
            original_post=original_post
        )
        repost.save()
        
        # --- BLOQUE DE DIFUSIÓN EN TIEMPO REAL (HARDENED) ---
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from core.api.serializers import PostSerializer
            channel_layer = get_channel_layer()

            # 1. 🟢 SEÑAL PRIVADA: Notificar al autor original
            author_id = getattr(original_post.author, 'id', None)
            if author_id and str(author_id) != str(request.user.id):
                Notification(actor=request.user, recipient=original_post.author, action_type='repost', post_id=repost).save()
                async_to_sync(channel_layer.group_send)(
                    f'user_{author_id}',
                    {'type': 'new_notification', 'data': {'type': 'repost', 'actor_name': request.user.name, 'post_id': str(repost.id)}}
                )

            # 2. 🌐 BROADCAST MUNDIAL: Notificar acción de compartir (Atómica)
            # Forzamos recarga y serialización con contexto completo
            original_post.reload()
            repost.reload()
            
            orig_data = PostSerializer(original_post, context={'request': request}).data
            repost_data = PostSerializer(repost, context={'request': request}).data
            
            async_to_sync(channel_layer.group_send)(
                'presence',
                {
                    'type': 'new_notification',
                    'data': {
                        'type': 'share_action',
                        'original_post': orig_data,
                        'new_repost': repost_data
                    }
                }
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"⚠️ Error en difusión Share Action:\n{error_trace}")
            with open("/tmp/share_debug.log", "a") as f:
                f.write(error_trace + "\n")
            
            try:
                # Intento desesperado: Al menos enviar la señal de nuevo post
                async_to_sync(channel_layer.group_send)(
                    'presence',
                    {'type': 'new_notification', 'data': {'type': 'feed_update', 'post': PostSerializer(repost, context={'request': request}).data}}
                )
            except Exception as inner_e:
                error_trace += f"\nInner error: {inner_e}"
            return Response({"detail": "Post compartido pero con errores", "repost_id": str(repost.id), "debug_error": error_trace}, status=201)

        return Response({"detail": "Post compartido con éxito", "repost_id": str(repost.id)}, status=201)
