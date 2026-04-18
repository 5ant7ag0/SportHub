from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, ValidationError
from core.models import User, AnalyticsEvent, Post, Message, Comment, Notification
from core.api.serializers import AnalyticsSerializer, MessageSerializer, PostSerializer, UserSerializer, NotificationSerializer
from core.api.auth import MongoJWTAuthentication
from bson import ObjectId
from mongoengine import Q
from bson.errors import InvalidId
from datetime import datetime, timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class AnalyticsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("=== INICIANDO ANALYTICS VIEW ===")
        try:
            user = User.objects.get(id=request.user.id)
            is_admin = getattr(user, 'role', '') == 'admin'
            print(f"Usuario: {user.email}, Admin: {is_admin}")
            
            # --- 1. TENDENCIAS (Seguro) ---
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)
            
            pipeline_trends = [
                {"$match": {
                    "action_type": {"$in": ["like", "comment"]},
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }}
            ]
            
            if not is_admin:
                pipeline_trends[0]["$match"]["recipient"] = user.id

            pipeline_trends.extend([
                {"$project": {
                    "day": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                    "type": "$action_type"
                }},
                {"$group": {
                    "_id": {"day": "$day", "type": "$type"},
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id.day": 1}}
            ])
            
            try:
                raw_trends = list(Notification._get_collection().aggregate(pipeline_trends))
            except Exception as e:
                print(f"Error Trends: {e}")
                raw_trends = []
            
            trends_map = {}
            for i in range(7):
                d = (end_date - timedelta(days=6-i)).strftime('%Y-%m-%d')
                trends_map[d] = {"day": d, "likes": 0, "comments": 0}
                
            for r in raw_trends:
                d = r["_id"]["day"]
                t = r["_id"]["type"]
                if d in trends_map:
                    if t == "like": trends_map[d]["likes"] = r["count"]
                    if t == "comment": trends_map[d]["comments"] = r["count"]
            
            formatted_trends = list(trends_map.values())

            # --- 2. LÓGICA DE DATOS ---
            if is_admin:
                try:
                    pipeline_sports = [
                        {"$match": {"sport": {"$exists": True, "$ne": "", "$ne": None}}},
                        {"$project": {"sport_upper": {"$toUpper": {"$toString": "$sport"}}}},
                        {"$group": {"_id": "$sport_upper", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ]
                    stats_deportes = list(User._get_collection().aggregate(pipeline_sports))
                except Exception as e:
                    stats_deportes = []

                # 🟢 REGRESAMOS A VISITAS REALES (Para que se mueva en vivo)
                try:
                    total_visitas_reales = AnalyticsEvent.objects.count()
                    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                    nuevos_hoy = AnalyticsEvent.objects(timestamp__gte=today_start).count()
                except Exception as e:
                    print(f"Error Visitas: {e}")
                    total_visitas_reales = 0
                    nuevos_hoy = 0

                try:
                    stats = AnalyticsEvent.get_visitor_age_stats(None) or {}
                    percentages = AnalyticsEvent.get_demographic_percentages(None) or []
                    
                    pipeline_engagement = [
                        {"$project": {"likes_count": {"$size": {"$ifNull": ["$likes", []]}}, "comments_count": {"$size": {"$ifNull": ["$comments", []]}}}},
                        {"$group": {"_id": None, "total_likes": {"$sum": "$likes_count"}, "total_comments": {"$sum": "$comments_count"}}}
                    ]
                    agg_engagement = list(Post._get_collection().aggregate(pipeline_engagement))
                    total_likes = agg_engagement[0].get('total_likes', 0) if agg_engagement else 0
                    total_comments = agg_engagement[0].get('total_comments', 0) if agg_engagement else 0
                    
                    total_users = User.objects.count()
                    total_posts = Post.objects.count()
                    
                    user_growth = User.get_user_growth_stats()
                    city_ranking = User.get_city_distribution()
                    connection_status = User.get_connection_metrics()
                    talent_growth = User.get_talent_correlation_stats()
                except Exception as e:
                    print(f"Error Global Stats: {e}")
                    stats = {}
                    percentages = []
                    total_likes = total_comments = total_users = total_posts = 0
                    user_growth = city_ranking = talent_growth = []
                    connection_status = {"online": 0, "offline": 0}

                # --- 3. PULSO DE LA COMUNIDAD (Heatmap) ---
                start_date_pulse = end_date - timedelta(days=7)
                
                pipeline_pulse_notif = [
                    {"$match": {
                        "timestamp": {"$gte": start_date_pulse},
                        "action_type": {"$in": ["like", "comment", "repost"]}
                    }},
                    {"$project": {
                        "day": {"$isoDayOfWeek": "$timestamp"},
                        "hour": {"$hour": "$timestamp"}
                    }},
                    {"$group": {
                        "_id": {"day": "$day", "hour": "$hour"},
                        "count": {"$sum": 1}
                    }}
                ]

                pipeline_pulse_msg = [
                    {"$match": {"timestamp": {"$gte": start_date_pulse}}},
                    {"$project": {
                        "day": {"$isoDayOfWeek": "$timestamp"},
                        "hour": {"$hour": "$timestamp"}
                    }},
                    {"$group": {
                        "_id": {"day": "$day", "hour": "$hour"},
                        "count": {"$sum": 1}
                    }}
                ]
                
                try:
                    # Usamos .objects().aggregate() para que MongoEngine maneje correctamente los objetos datetime
                    raw_pulse_notif = list(Notification.objects(
                        timestamp__gte=start_date_pulse,
                        action_type__in=["like", "comment", "repost"]
                    ).aggregate(
                        {"$project": {
                            "day": {"$isoDayOfWeek": "$timestamp"},
                            "hour": {"$hour": "$timestamp"}
                        }},
                        {"$group": {
                            "_id": {"day": "$day", "hour": "$hour"},
                            "count": {"$sum": 1}
                        }}
                    ))

                    raw_pulse_msg = list(Message.objects(
                        timestamp__gte=start_date_pulse
                    ).aggregate(
                        {"$project": {
                            "day": {"$isoDayOfWeek": "$timestamp"},
                            "hour": {"$hour": "$timestamp"}
                        }},
                        {"$group": {
                            "_id": {"day": "$day", "hour": "$hour"},
                            "count": {"$sum": 1}
                        }}
                    ))
                    
                    print(f"DEBUG PULSO: Notif={len(raw_pulse_notif)}, Msg={len(raw_pulse_msg)}")
                    
                    pulse_map = {}
                    for r in raw_pulse_notif + raw_pulse_msg:
                        key = f"{r['_id']['day']}-{r['_id']['hour']}"
                        pulse_map[key] = pulse_map.get(key, 0) + r["count"]
                    
                    pulse_data = []
                    for d in range(1, 8):
                        for h in range(24):
                            key = f"{d}-{h}"
                            pulse_data.append({
                                "day": d,
                                "hour": h,
                                "count": pulse_map.get(key, 0)
                            })
                except Exception as e:
                    print(f"Error Pulso: {e}")
                    pulse_data = [{"error": str(e), "day": 1, "hour": 0, "count": 0}]
                
                data = {
                    "total_visits": total_visitas_reales, 
                    "new_followers": nuevos_hoy,          
                    "average_age": round(stats.get('average_age', 0), 2) if stats else 0.0,
                    "demographics": percentages,
                    "total_likes": total_likes,
                    "total_comments": total_comments,
                    "is_global": True,
                    "extra_stats": {"total_users": total_users, "total_posts": total_posts},
                    "stats_por_deporte": stats_deportes, 
                    "trends": formatted_trends,
                    "user_growth": user_growth,
                    "city_ranking": city_ranking,
                    "connection_status": connection_status,
                    "community_pulse": pulse_data,
                    "talent_growth": talent_growth,
                    "roles_distribution": AnalyticsEvent.get_role_distribution(None)
                }
            else:
                target_profile_id = request.query_params.get('profile_id') or str(user.id)
                
                try:
                    total_visitas_reales = AnalyticsEvent.objects(visited_profile_id=target_profile_id).count()
                    current_user_reloaded = User.objects.get(id=user.id)
                    nuevos_hoy = len(current_user_reloaded.followers)
                    
                    stats = AnalyticsEvent.get_visitor_age_stats(target_profile_id) or {}
                    percentages = AnalyticsEvent.get_demographic_percentages(target_profile_id) or []
                    
                    pipeline_personal = [
                        {"$match": {"author": user.id}},
                        {"$project": {"likes_count": {"$size": {"$ifNull": ["$likes", []]}}, "comments_count": {"$size": {"$ifNull": ["$comments", []]}}}},
                        {"$group": {"_id": None, "total_likes": {"$sum": "$likes_count"}, "total_comments": {"$sum": "$comments_count"}}}
                    ]
                    agg_personal = list(Post._get_collection().aggregate(pipeline_personal))
                    total_likes = agg_personal[0].get('total_likes', 0) if agg_personal else 0
                    total_comments = agg_personal[0].get('total_comments', 0) if agg_personal else 0
                except Exception as e:
                    total_visitas_reales = nuevos_hoy = 0
                    stats = {}
                    percentages = []
                    total_likes = total_comments = 0

                data = {
                    "total_visits": total_visitas_reales,
                    "new_followers": nuevos_hoy,
                    "average_age": round(stats.get('average_age', 0), 2) if stats else 0.0,
                    "demographics": percentages,
                    "total_likes": total_likes,
                    "total_comments": total_comments,
                    "is_global": False,
                    "trends": formatted_trends,
                    "roles_distribution": AnalyticsEvent.get_role_distribution(target_profile_id),
                    "visits_today": AnalyticsEvent.objects(
                        visited_profile_id=target_profile_id, 
                        timestamp__gte=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                    ).count()
                }
            
            serializer = AnalyticsSerializer(data)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"CRITICAL ERROR IN ANALYTICS VIEW: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                "total_visits": 0, "new_followers": 0, "average_age": 0, "demographics": [],
                "total_likes": 0, "total_comments": 0, "is_global": False,
                "extra_stats": {"total_users": 0, "total_posts": 0},
                "stats_por_deporte": [], "trends": [], "user_growth": [],
                "city_ranking": [], "connection_status": {"online": 0, "offline": 0}
            }, status=200)

class FollowView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('target_id')
        user = request.user

        if str(user.id) == str(target_id):
            raise ValidationError("No puedes seguirte a ti mismo.")

        try:
            target_user = User.objects.get(id=target_id)
        except (User.DoesNotExist, InvalidId):
            raise NotFound("Usuario a seguir no encontrado.")

        # Comprobación atómica para evitar desincronización por estado en memoria (stale)
        is_following = User.objects(id=user.id, following=target_user.id).count() > 0
        
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()

        if is_following:
            User.objects(id=user.id).update_one(pull__following=target_user)
            User.objects(id=target_user.id).update_one(pull__followers=user)
            detail = f"Has dejado de seguir a {target_user.name}"
            # Notificar ambos para que actualicen contadores
            try:
                # Al seguido
                async_to_sync(channel_layer.group_send)(
                    f'user_{target_user.id}',
                    {'type': 'new_notification', 'data': {'type': 'count_update', 'followers_count': len(target_user.followers) - 1}}
                )
                # Al seguidor (yo)
                async_to_sync(channel_layer.group_send)(
                    f'user_{user.id}',
                    {'type': 'new_notification', 'data': {'type': 'count_update', 'following_count': len(user.following) - 1}}
                )
                
                # 📡 BROADCAST AL PERFIL (Decremento en tiempo real para todos)
                async_to_sync(channel_layer.group_send)(
                    f'profile_{target_user.id}',
                    {
                        'type': 'profile_update',
                        'data': {
                            'profile_id': str(target_user.id),
                            'followers_count': len(target_user.followers) - 1
                        }
                    }
                )
            except: pass
        else:
            User.objects(id=user.id).update_one(add_to_set__following=target_user)
            User.objects(id=target_user.id).update_one(add_to_set__followers=user)
            Notification(actor=user, recipient=target_user, action_type='follow').save()
            detail = f"Ahora sigues a {target_user.name}"
            
            try:
                # Al seguido (nueva notificación + followers +1)
                async_to_sync(channel_layer.group_send)(
                    f'user_{target_user.id}',
                    {
                        'type': 'new_notification',
                        'data': {
                            'type': 'follow',
                            'actor_name': user.name,
                            'actor_id': str(user.id),
                            'followers_count': len(target_user.followers) + 1
                        }
                    }
                )
                # Al seguidor (yo) (following +1)
                async_to_sync(channel_layer.group_send)(
                    f'user_{user.id}',
                    {'type': 'new_notification', 'data': {'type': 'count_update', 'following_count': len(user.following) + 1}}
                )
                
                # 📡 BROADCAST AL PERFIL (Para que todo espectador vea el incremento)
                async_to_sync(channel_layer.group_send)(
                    f'profile_{target_user.id}',
                    {
                        'type': 'profile_update',
                        'data': {
                            'profile_id': str(target_user.id),
                            'followers_count': len(target_user.followers) + 1
                        }
                    }
                )
            except: pass

        # Forzar recarga de ambos para consistencia total en la respuesta
        user.reload()
        target_user.reload()
        
        return Response({
            "detail": detail,
            "is_following": User.objects(id=user.id, following=target_user.id).count() > 0,
            "following_count": len(user.following),
            "followers_count": len(target_user.followers)
        }, status=200)

class LikeView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post_id')
        user = request.user

        try:
            post = Post.objects.get(id=post_id)
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post no encontrado.")

        if user in post.likes:
            Post.objects(id=post_id).update_one(pull__likes=user)
            like_removed = True
        else:
            Post.objects(id=post_id).update_one(add_to_set__likes=user)
            like_removed = False
            if str(post.author.id) != str(user.id):
                Notification(actor=user, recipient=post.author, action_type='like', post_id=post).save()
                
                # 🟢 SEÑAL REAL-TIME: Notificar al autor del post (Privado)
                try:
                    from channels.layers import get_channel_layer
                    from asgiref.sync import async_to_sync
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f'user_{post.author.id}',
                        {
                            'type': 'new_notification',
                            'data': {
                                'type': 'like',
                                'actor_name': user.name,
                                'post_id': str(post.id)
                            }
                        }
                    )
                except Exception: pass
        
        # 🌐 BROADCAST MUNDIAL: Notificar a todos en el feed (Tanto en like como en unlike)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
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
            
            # 📡 BROADCAST AL PERFIL: Actualizar TOTAL LIKES de la cabecera del autor
            pipeline_agg = [
                {"$match": {"author": post.author.id}},
                {"$project": {"likes_count": {"$size": {"$ifNull": ["$likes", []]}}}},
                {"$group": {"_id": None, "total": {"$sum": "$likes_count"}}}
            ]
            agg_res = list(Post._get_collection().aggregate(pipeline_agg))
            new_total_likes = agg_res[0].get('total', 0) if agg_res else 0
            
            async_to_sync(channel_layer.group_send)(
                f'profile_{post.author.id}',
                {
                    'type': 'profile_update',
                    'data': {
                        'profile_id': str(post.author.id),
                        'total_likes': new_total_likes
                    }
                }
            )
        except Exception as e:
            print(f"WS broadcast like/unlike error: {e}")
                    
        return Response({"detail": "Like removido." if like_removed else "Like agregado."}, status=200)

class SendMessageView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        body = request.data.get('body', '')
        user = request.user
        file = request.FILES.get('file')

        if not body and not file:
            raise ValidationError("El mensaje no puede estar vacío.")

        try:
            receiver = User.objects.get(id=ObjectId(receiver_id))
        except (User.DoesNotExist, InvalidId, TypeError):
            raise NotFound("Destinatario no encontrado.")

        media_url = None
        if file:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import os
            import time
            
            filename = f"chat_{int(time.time())}_{file.name.replace(' ', '_')}"
            path = default_storage.save(os.path.join('media/chat', filename), ContentFile(file.read()))
            media_url = f"/media/chat/{filename}"

        message = Message(
            sender=user,
            receiver=receiver,
            body=body,
            media_url=media_url,
            unread_by=[receiver]
        )
        message.save()
        
        if receiver not in user.active_chats:
            user.update(add_to_set__active_chats=receiver)
        if user not in receiver.active_chats:
            receiver.update(add_to_set__active_chats=user)

        serializer = MessageSerializer(message)
        
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
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
            print(f"WebSocket send error: {e}")

        return Response(serializer.data, status=201)

class InboxView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            all_contact_ids = set()
            
            if user.active_chats:
                for u in user.active_chats:
                    try:
                        if u and hasattr(u, 'id'): all_contact_ids.add(str(u.id))
                    except: continue
            
            try:
                sent_to = Message.objects(sender=user).scalar('receiver')
                received_from = Message.objects(receiver=user).scalar('sender')
                for uid in list(sent_to) + list(received_from):
                    if uid:
                        oid_str = str(uid.id) if hasattr(uid, 'id') else str(uid)
                        if ObjectId.is_valid(oid_str):
                            all_contact_ids.add(oid_str)
            except Exception as e:
                print(f"Error escaneando historial: {e}")

            active_users_map = {}
            if all_contact_ids:
                unique_oids = [ObjectId(oid) for oid in all_contact_ids]
                users_qs = User.objects(id__in=unique_oids)
                for u in users_qs:
                    active_users_map[str(u.id)] = u

            conversations = []
            from core.api.serializers import UserSerializer
            
            active_chat_ids = set()
            if user.active_chats:
                for u in user.active_chats:
                    try:
                        if u and hasattr(u, 'id'): active_chat_ids.add(str(u.id))
                    except: continue

            for contact_id, contact in active_users_map.items():
                if contact_id == str(user.id): continue

                try:
                    last_msg = Message.objects(
                        (Q(sender=user) & Q(receiver=contact)) | 
                        (Q(sender=contact) & Q(receiver=user))
                    ).order_by('-timestamp').first()
                    
                    is_persistent = contact_id in active_chat_ids

                    if last_msg or is_persistent:
                        sender_id = ""
                        if last_msg and last_msg.sender:
                            try: sender_id = str(last_msg.sender.id)
                            except: pass
                        
                        is_me = sender_id == str(user.id)
                        prefix = "Tú: " if is_me else ""
                        
                        content = ""
                        if last_msg:
                            content = getattr(last_msg, 'body', "") or ""
                            if not content or content == "📎 Archivo Multimedia":
                                if getattr(last_msg, 'media_url', None):
                                    video_exts = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.quicktime']
                                    is_video = any(last_msg.media_url.lower().endswith(ext) for ext in video_exts)
                                    content = "🎥 Video" if is_video else "📷 Imagen"
                        else:
                            content = "No hay mensajes todavía"
                        
                        last_msg_preview = f"{prefix}{content}" if last_msg else content
                        
                        if not contact: continue
                        
                        conversations.append({
                            "contact": UserSerializer(contact, context={'request': request}).data,
                            "last_message": {
                                "body": getattr(last_msg, 'body', "") if last_msg else "",
                                "content": last_msg_preview,
                                "timestamp": getattr(last_msg, 'timestamp', datetime.utcnow()) if last_msg else datetime.utcnow(),
                                "sender_id": sender_id,
                                "media_url": getattr(last_msg, 'media_url', "") if last_msg else ""
                            },
                            "unread_count": Message.objects(receiver=user, unread_by=user, sender=contact).count() if (contact and hasattr(Message, 'unread_by')) else 0,
                            "last_timestamp": getattr(last_msg, 'timestamp', datetime.utcnow()) if last_msg else datetime.utcnow()
                        })
                except Exception as e:
                    print(f"Error procesando chat para {contact_id}: {e}")
            
            try:
                conversations.sort(
                    key=lambda x: (x.get('last_timestamp').replace(tzinfo=None) if x.get('last_timestamp') else datetime.min), 
                    reverse=True
                )
            except Exception as e:
                print(f"Error ordenando conversaciones: {e}")
            
            return Response(conversations, status=200)
            
        except Exception as outer_e:
            print(f"ERROR FATAL EN INBOX: {outer_e}")
            return Response([], status=200)

class UnreadCountView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if hasattr(Message, 'unread_by'):
                unique_senders = Message.objects(unread_by=user).distinct('sender')
                count = len(unique_senders)
            else:
                count = 0
            return Response({"unread_count": count}, status=200)
        except Exception as e:
            print(f"Error en UnreadCountView: {e}")
            return Response({"unread_count": 0}, status=200)

class ClearChatView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, contact_id):
        user = request.user
        try:
            contact = User.objects.get(id=ObjectId(contact_id))
            Message.objects(
                (Q(sender=user) & Q(receiver=contact)) | 
                (Q(sender=contact) & Q(receiver=user))
            ).delete()
            return Response({"detail": "Chat vaciado"}, status=200)
        except:
            return Response({"error": "Error al vaciar chat"}, status=400)

class DeleteChatView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, contact_id):
        user = request.user
        try:
            contact = User.objects.get(id=ObjectId(contact_id))
            Message.objects(
                (Q(sender=user) & Q(receiver=contact)) | 
                (Q(sender=contact) & Q(receiver=user))
            ).delete()
            user.update(pull__active_chats=contact)
            return Response({"detail": "Chat eliminado"}, status=200)
        except:
            return Response({"error": "Error al eliminar chat"}, status=400)

class MarkAsUnreadView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, contact_id):
        user = request.user
        try:
            contact = User.objects.get(id=ObjectId(contact_id))
            last_received = Message.objects(sender=contact, receiver=user).order_by('-timestamp').first()
            if last_received:
                last_received.update(add_to_set__unread_by=user)
            return Response({"detail": "Marcado como no leído"}, status=200)
        except:
            return Response({"error": "Error al marcar como no leído"}, status=400)

class ConversationDetailView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, contact_id):
        user = request.user
        try:
            contact = User.objects.get(id=ObjectId(contact_id))
        except (User.DoesNotExist, InvalidId, TypeError):
            raise NotFound("Contacto no encontrado")

        messages = Message.objects(
            (Q(sender=user) & Q(receiver=contact)) | 
            (Q(sender=contact) & Q(receiver=user))
        ).order_by('timestamp') 

        try:
            Message.objects(receiver=user, unread_by=user, sender=contact).update(pull__unread_by=user)
        except: pass

        serializer = MessageSerializer(messages, many=True)
        formatted_messages = []
        for msg in serializer.data:
            m = dict(msg)
            m["isMe"] = m['sender_id'] == str(user.id)
            formatted_messages.append(m)
            
        return Response(formatted_messages, status=200)

    def post(self, request, contact_id):
        user = request.user
        try:
            contact = User.objects.get(id=ObjectId(contact_id))
            Message.objects(receiver=user, sender=contact, unread_by=user).update(pull__unread_by=user)
            return Response({"detail": "Marcado como leído"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class FeedView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sport = request.query_params.get('sport')
        post_type = request.query_params.get('post_type')
        filter_q = Q()
        
        if sport:
            from core.models import User
            matching_users = User.objects(sport=sport)
            filter_q &= Q(author__in=matching_users)

        if post_type:
            filter_q &= Q(post_type=post_type)

        # --- PAGINACIÓN ---
        try:
            limit = int(request.query_params.get('limit', 20))
            offset = int(request.query_params.get('offset', 0))
        except:
            limit, offset = 20, 0

        posts = Post.objects(filter_q).order_by('-timestamp')[offset : offset + limit]
        
        try:
            serializer = PostSerializer(posts, many=True, context={'request': request})
            return Response({
                "posts": serializer.data,
                "has_more": len(serializer.data) == limit
            }, status=200)
        except Exception as e:
            print(f"CRITICAL SERIALIZATION ERROR IN FEED: {e}")
            fallback_data = []
            for post in posts[:limit]: 
                try:
                    fallback_data.append(PostSerializer(post, context={'request': request}).data)
                except: continue
            return Response({"posts": fallback_data, "has_more": len(fallback_data) == limit}, status=200)

class PostDetailView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=ObjectId(post_id))
            serializer = PostSerializer(post, context={'request': request, 'full_comments': True})
            return Response(serializer.data, status=200)
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Publicación no encontrada.")

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(id=ObjectId(post_id))
            if str(post.author.id) != str(request.user.id):
                return Response({"error": "No tienes permiso para eliminar este post."}, status=403)
            
            reposts_deleted = Post.objects(original_post=post, is_repost=True).delete()
            post.delete()
            Notification.objects(post_id=post).delete()
            
            return Response({
                "detail": "Post eliminado exitosamente.",
                "reposts_deleted": reposts_deleted
            }, status=200)
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post no encontrado.")

class ProfileView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_id = request.query_params.get('id')
        if target_id:
            try:
                profile_user = User.objects.get(id=target_id)
                
                # SE ELIMINÓ EL REGISTRO DE VISITAS Y EL WEBSOCKET PARA DIAGNÓSTICO
                pass
            except (User.DoesNotExist, InvalidId):
                raise NotFound("Usuario no encontrado.")
        else:
            profile_user = user

        try:
            user_data = UserSerializer(profile_user, context={'request': request}).data
            # ELIMINADO: user_data['is_following'] = profile_user in user.following
            # Confiamos 100% en el serializador que ya hace una consulta atómica a MongoDB.
            
            posts = Post.objects.filter(author=profile_user).order_by('-timestamp')
            user_data['posts'] = PostSerializer(posts, many=True, context={'request': request}).data
        except Exception as e:
            print(f"ERROR SERIALIZANDO PERFIL: {e}")
            return Response({
                "id": str(profile_user.id),
                "name": getattr(profile_user, 'name', "Usuario"),
                "avatar_url": getattr(profile_user, 'avatar_url', "/test_media/sample_atleta.svg"),
                "bio": getattr(profile_user, 'bio', ""),
                "role": getattr(profile_user, 'role', "athlete"),
                "followers_count": 0,
                "following_count": 0,
                "posts": [],
                "skills": {},
                "achievements": []
            }, status=200)

        return Response(user_data, status=200)

class CommentView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post_id')
        text = request.data.get('text')
        user = request.user

        if not post_id or not text:
            raise ValidationError("Se requiere post_id y text.")
            
        try:
            post = Post.objects.get(id=ObjectId(post_id))
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post no encontrado.")

        media_url = request.data.get('media_url', '')
        new_comment = Comment(author=user, text=text, media_url=media_url)
        post.update(push__comments=new_comment)
        
        if str(post.author.id) != str(user.id):
            Notification(actor=user, recipient=post.author, action_type='comment', post_id=post).save()
            
            # 🟢 SEÑAL REAL-TIME: Notificar al autor del post (Privado)
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{post.author.id}',
                    {
                        'type': 'new_notification',
                        'data': {
                            'type': 'comment',
                            'actor_name': user.name,
                            'post_id': str(post.id),
                            'text_preview': text[:50]
                        }
                    }
                )
            except Exception: pass

        # 🌐 BROADCAST MUNDIAL: Notificar a todos en el feed
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            post.reload() # Importante para traer el nuevo comentario
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
            print(f"WS broadcast comment error: {e}")
            
        return Response({"message": "Comentario agregado exitosamente."}, status=201)

class NotificationListView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects(recipient=request.user).order_by('-timestamp').limit(50)
        
        valid_notifications = []
        for n in notifications:
            try:
                if n.actor:
                    valid_notifications.append(n)
                else:
                    n.delete()
            except:
                continue

        Notification.objects(recipient=request.user, read=False).update(set__read=True)
        serializer = NotificationSerializer(valid_notifications, many=True, context={'request': request})
        return Response(serializer.data, status=200)

class NotificationCountView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects(recipient=request.user, read=False).count()
        return Response({"unread_count": count}, status=200)

class SearchView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        sport = request.query_params.get('sport')
        role = request.query_params.get('role')
        city = request.query_params.get('city')
        position = request.query_params.get('position')

        search_filter = Q(id__ne=request.user.id)
        
        if query:
            search_filter &= (Q(name__icontains=query) | Q(email__icontains=query))
            
        if sport:
            search_filter &= Q(sport__icontains=sport)
        if role:
            search_filter &= Q(role=role)
        if city:
            search_filter &= Q(city__icontains=city)
        if position:
            search_filter &= Q(position__icontains=position)

        users = User.objects(search_filter).limit(50)
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data, status=200)

class NetworkSuggestionsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        exclude_ids = [user.id] + [f.id for f in user.following]
        
        pipeline = [
            {"$match": {"_id": {"$nin": exclude_ids}}},
            {"$sample": {"size": 9}}
        ]
        
        raw_results = list(User.objects.aggregate(pipeline))
        suggestions = [User._from_son(doc) for doc in raw_results]
            
        serializer = UserSerializer(suggestions, many=True, context={'request': request})
        return Response(serializer.data, status=200)

class SavePostView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post_id')
        user = request.user

        if not post_id:
            raise ValidationError("Se requiere post_id.")
            
        try:
            post = Post.objects.get(id=ObjectId(post_id))
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post no encontrado.")

        if post in user.saved_posts:
            User.objects(id=user.id).update_one(pull__saved_posts=post)
            saved = False
        else:
            User.objects(id=user.id).update_one(add_to_set__saved_posts=post)
            saved = True
            
        return Response({"message": "Estado de guardado actualizado.", "saved": saved}, status=200)

class ConnectionRequestView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('target_id')
        user = request.user
        if not target_id:
            return Response({"error": "target_id requerido"}, status=400)
        try:
            target = User.objects.get(id=ObjectId(target_id))
            target.update(add_to_set__pending_connections=user)
            return Response({"detail": "Solicitud enviada"}, status=200)
        except:
            return Response({"error": "Usuario no encontrado"}, status=404)

class AcceptConnectionView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('target_id')
        action = request.data.get('action') 
        user = request.user
        
        if not target_id or not action:
            return Response({"error": "target_id y action requeridos"}, status=400)
            
        try:
            target = User.objects.get(id=ObjectId(target_id))
            user.update(pull__pending_connections=target)
            
            if action == 'accept':
                user.update(add_to_set__followers=target)
                target.update(add_to_set__following=user)
                user.reload()
                return Response({
                    "detail": "Solicitud aceptada",
                    "followers_count": len(user.followers),
                    "following_count": len(user.following)
                }, status=200)
            return Response({"detail": "Solicitud rechazada"}, status=200)
        except:
             return Response({"error": "Fallo al procesar conexión"}, status=400)

class EditMessageView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, message_id):
        body = request.data.get('body')
        if not body:
            return Response({"error": "cuerpo requerido"}, status=400)
        try:
            msg = Message.objects.get(id=ObjectId(message_id), sender=request.user)
            msg.update(set__body=body, set__is_edited=True)
            
            # --- DIFUSIÓN EN TIEMPO REAL AL RECEPTOR ---
            try:
                msg.reload()
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
                from core.api.serializers import MessageSerializer
                serializer = MessageSerializer(msg, context={'request': request})
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'user_{msg.receiver.id}',
                    {
                        'type': 'new_notification',
                        'data': {
                            'type': 'message_update',
                            'message': serializer.data
                        }
                    }
                )
            except Exception as e:
                print(f"Error WS al editar mensaje: {e}")

            return Response({"detail": "Mensaje editado"}, status=200)
        except Exception as e:
             return Response({"error": "No tienes permiso o no existe"}, status=404)

class EditPostView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id):
        content = request.data.get('content')
        s_title = request.data.get('service_title')
        s_price = request.data.get('service_price')

        if not content:
            return Response({"error": "contenido requerido"}, status=400)
        try:
            post = Post.objects.get(id=ObjectId(post_id), author=request.user)
            
            update_fields = {
                'set__content': content,
                'set__is_edited': True
            }

            if s_title is not None:
                update_fields['set__service_title'] = s_title
            
            if s_price is not None:
                try:
                    update_fields['set__service_price'] = float(s_price)
                except (ValueError, TypeError):
                    pass

            post.update(**update_fields)

            # 🌐 BROADCAST MUNDIAL: Notificar edición
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
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
            except Exception: pass

            return Response({"detail": "Post editado con éxito"}, status=200)
        except Exception as e:
            return Response({"error": "No tienes permiso o el post no existe"}, status=404)

class RatePostView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        score_val = request.data.get('score')
        if score_val is None:
            return Response({"error": "Puntuación requerida"}, status=400)
            
        try:
            score = int(score_val)
            if score < 1 or score > 5:
                return Response({"error": "Puntuación debe estar entre 1 y 5"}, status=400)
                
            post = Post.objects.get(id=ObjectId(post_id))
            if post.post_type != 'service':
                return Response({"error": "Solo se pueden calificar servicios profesionales"}, status=400)
                
            if post.author.id == request.user.id:
                return Response({"error": "No puedes calificar tu propio servicio"}, status=400)
                
            from core.models import Rating
            if Rating.objects(user=request.user, post=post).count() > 0:
                return Response({"error": "Ya has calificado este servicio anteriormente"}, status=400)
                
            Rating(user=request.user, post=post, score=score).save()
            
            current_count = post.ratings_count or 0
            current_avg = post.average_rating or 0.0
            
            new_count = current_count + 1
            new_avg = (current_avg * current_count + score) / new_count
            
            post.update(set__average_rating=new_avg, set__ratings_count=new_count)
            
            # 🌐 BROADCAST MUNDIAL: Notificar nueva calificación
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync
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
                
                # 📡 BROADCAST AL PERFIL: Actualizar Promedio de Rating
                async_to_sync(channel_layer.group_send)(
                    f'profile_{post.author.id}',
                    {
                        'type': 'profile_update',
                        'data': {
                            'profile_id': str(post.author.id),
                            'average_rating': round(new_avg, 1)
                        }
                    }
                )
            except Exception: pass

            return Response({
                "detail": "Calificación registrada con éxito",
                "average_rating": round(new_avg, 1),
                "ratings_count": new_count
            }, status=201)
            
        except ValueError:
            return Response({"error": "Puntuación inválida"}, status=400)
        except Post.DoesNotExist:
            return Response({"error": "Servicio no disponible"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class PendingConnectionsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        pending_users = user.pending_connections
        from core.api.serializers import UserSerializer
        data = UserSerializer(pending_users, many=True).data
        return Response(data, status=200)

class ConnectionsListView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        connection_ids = list(set([f.id for f in user.followers] + [f.id for f in user.following]))
        connections = User.objects(id__in=connection_ids)
        
        from core.api.serializers import UserSerializer
        serializer = UserSerializer(connections, many=True, context={'request': request})
        return Response(serializer.data, status=200)

class PostLikesListView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=ObjectId(post_id))
            from core.api.serializers import UserSerializer
            serializer = UserSerializer(post.likes, many=True, context={'request': request})
            return Response(serializer.data, status=200)
        except (Post.DoesNotExist, InvalidId):
            raise NotFound("Post no encontrado.")

class AdminUserManagementView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', '') != 'admin':
            return Response({"detail": "No tienes permisos para esta acción."}, status=403)
        
        users = User.objects().order_by('-created_at')
        from core.api.serializers import UserSerializer
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data, status=200)

    def patch(self, request):
        if getattr(request.user, 'role', '') != 'admin':
            return Response({"detail": "No tienes permisos para esta acción."}, status=403)
        
        user_id = request.data.get('user_id')
        action = request.data.get('action') 
        
        if not user_id or not action:
            raise ValidationError("user_id y action son obligatorios.")
            
        try:
            target_user = User.objects.get(id=ObjectId(user_id))
            
            if str(target_user.id) == str(request.user.id):
                return Response({"detail": "No puedes modificar tu propio estado administrativo."}, status=400)

            if action == 'promote':
                if target_user.role == 'admin':
                    target_user.role = 'athlete'
                    detail_msg = f"Usuario {target_user.name} degradado a atleta."
                else:
                    target_user.role = 'admin'
                    detail_msg = f"Usuario {target_user.name} promovido a administrador."
            elif action == 'suspend':
                target_user.is_suspended = True
            elif action == 'reactivate':
                target_user.is_suspended = False
                target_user.is_active = True
            elif action == 'delete':
                target_user.is_active = False 
            else:
                raise ValidationError("Acción no válida.")
                
            target_user.save()
            from core.api.serializers import UserSerializer
            return Response({
                "detail": f"Acción {action} completada para {target_user.name}",
                "user": UserSerializer(target_user).data
            }, status=200)
            
        except (User.DoesNotExist, InvalidId):
            raise NotFound("Usuario no encontrado.")