import cloudinary.uploader
import json
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.api.auth import MongoJWTAuthentication
from core.models import User
from core.api.serializers import UserSerializer

class ProfileUpdateView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        return self.put(request)

    def put(self, request):
        user = request.user
        data = request.data
        file_obj = request.FILES.get('file')

        # Actualización de campos básicos (Solo si vienen en el request)
        if 'name' in data and data.get('name'):
            user.name = data.get('name')
        if 'bio' in data:
            user.bio = data.get('bio')
        if 'sport' in data:
            user.sport = data.get('sport')
        if 'city' in data:
            user.city = data.get('city')
        if 'birth_date' in data and data.get('birth_date'):
            user.birth_date = data.get('birth_date')
        
        # Nuevos campos de configuración
        if 'is_private' in data:
            val = data.get('is_private')
            user.is_private = str(val).lower() == 'true' if isinstance(val, (str, bool)) else bool(val)
        if 'notifications_enabled' in data:
            val = data.get('notifications_enabled')
            user.notifications_enabled = str(val).lower() == 'true' if isinstance(val, (str, bool)) else bool(val)

        # Habilidades y Logros (Soporta JSON strings de FormData)
        if data.get('skills'):
            try:
                skills_data = data.get('skills')
                user.skills = json.loads(skills_data) if isinstance(skills_data, str) else skills_data
            except: pass
        if data.get('achievements'):
            try:
                ach_data = data.get('achievements')
                user.achievements = json.loads(ach_data) if isinstance(ach_data, str) else ach_data
            except: pass

        if data.get('social_links'):
            try:
                social_data = data.get('social_links')
                user.social_links = json.loads(social_data) if isinstance(social_data, str) else social_data
            except: pass

        # GESTIÓN DE SEGURIDAD (Email y Password)
        current_password = data.get('current_password')
        new_email = data.get('new_email')
        new_password = data.get('new_password')

        if new_email or new_password:
            # Validación de identidad obligatoria para cambios sensibles
            if not current_password or user.password != current_password:
                return Response({"error": "La contraseña actual es incorrecta o no fue proporcionada."}, status=403)
            
            if new_email and new_email != user.email:
                if User.objects(email=new_email).first():
                    return Response({"error": "El nuevo correo electrónico ya está en uso por otro usuario."}, status=400)
                user.email = new_email
            
            if new_password:
                user.password = new_password

        # Proceso de carga de Avatar
        if file_obj:
            c_url = os.environ.get('CLOUDINARY_URL', '')
            if 'dummy' in c_url.lower() or not c_url:
                from django.core.files.storage import default_storage
                from django.conf import settings
                # Limpiar nombre de archivo para evitar problemas de ruta
                safe_name = "".join([c for c in file_obj.name if c.isalnum() or c in '._-']).strip()
                filename = default_storage.save(f"avatars/{safe_name}", file_obj)
                user.avatar_url = f"{settings.MEDIA_URL}{filename}"
            else:
                try:
                    upload_data = cloudinary.uploader.upload(
                        file_obj, 
                        folder="sporthub_profiles",
                        resource_type="auto"
                    )
                    user.avatar_url = upload_data.get('secure_url', '')
                except Exception as e:
                    return Response({'error': f"Error al subir imagen: {str(e)}"}, status=500)

        try:
            # Forzamos actualización atómica directa a MongoDB para evitar problemas de dirty fields
            update_data = {
                'set__name': user.name,
                'set__email': user.email,
                'set__password': user.password,
                'set__bio': user.bio,
                'set__sport': user.sport,
                'set__city': user.city,
                'set__birth_date': user.birth_date,
                'set__avatar_url': user.avatar_url,
                'set__is_private': user.is_private,
                'set__notifications_enabled': user.notifications_enabled,
                'set__skills': user.skills,
                'set__achievements': user.achievements,
                'set__social_links': user.social_links
            }
            user.update(**update_data)
            user.reload() # Forzar re-lectura post-escritura
            
            serializer = UserSerializer(user)
            return Response({
                "detail": "Perfil actualizado correctamente en MongoDB",
                "user": serializer.data
            }, status=200)
        except Exception as e:
            return Response({"error": f"Error crítico de persistencia NoSQL: {str(e)}"}, status=500)

class AccountDeleteView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get('password')

        if not password or user.password != password:
            return Response({"error": "Verificación de identidad fallida. Contraseña incorrecta."}, status=403)

        try:
            # Eliminar al usuario definitivamente
            user.delete()
            return Response({"detail": "Cuenta eliminada permanentemente."}, status=200)
        except Exception as e:
            return Response({"error": f"Error al eliminar la cuenta: {str(e)}"}, status=500)
