from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
import cloudinary.uploader
import os
from core.models import User

def generate_tokens_for_user(user):
    """
    Genera tokens personalizados para MongoEngine usando la funcionalidad básica
    de simplejwt, inyectando propiedades de control como role y user_id.
    """
    refresh = RefreshToken()
    refresh['user_id'] = str(user.id)
    refresh['name'] = user.name
    refresh['role'] = user.role or 'athlete'
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class CustomTokenObtainPairView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            raise ValidationError("Email y password son obligatorios.")
            
        # Validación NoSQL (usaremos comparación directa del seed en texto plano)
        user = User.objects(email=email).first()
        
        # Permitir explícitamente hashed_password_mock para pruebas manuales
        if not user or user.password != password:
            raise AuthenticationFailed("Credenciales inválidas.")
            
        tokens = generate_tokens_for_user(user)
        return Response(tokens)

class CustomTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            raise ValidationError("Refresh token es obligatorio.")
            
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
            })
        except TokenError:
            raise AuthenticationFailed("Refresh token inválido o expirado.")

class RegisterView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')
        birth_date = request.data.get('birth_date')
        file_obj = request.FILES.get('file')

        if not email or not password or not name or not birth_date:
            raise ValidationError("Todos los campos (email, password, name, birth_date) son obligatorios.")

        if User.objects(email=email).first():
            raise ValidationError("El usuario ya existe.")

        avatar_url = '/test_media/sample_atleta.svg'
        if file_obj:
            c_url = os.environ.get('CLOUDINARY_URL', '')
            if 'dummy' in c_url.lower() or not c_url:
                from django.core.files.storage import default_storage
                from django.conf import settings
                import os as django_os
                # Limpiar nombre de archivo para evitar problemas de ruta
                safe_name = "".join([c for c in file_obj.name if c.isalnum() or c in '._-']).strip()
                filename = default_storage.save(f"avatars/{safe_name}", file_obj)
                avatar_url = f"{settings.MEDIA_URL}{filename}"
            else:
                try:
                    upload_data = cloudinary.uploader.upload(
                        file_obj,
                        folder="sporthub_registrations",
                        resource_type="auto"
                    )
                    avatar_url = upload_data.get('secure_url', avatar_url)
                except Exception as e:
                    print(f"Error subiendo avatar en registro (Cloudinary): {e}")
                    # No lanzamos error para no romper el registro si falla el storage

        # Creamos usuario con el esquema completo para evitar 'UI Crashes'
        user = User(
            email=email,
            password=password, 
            name=name,
            birth_date=birth_date,
            avatar_url=avatar_url,
            bio=request.data.get('bio', "Nuevo Miembro de SportHub."),
            sport=request.data.get('sport') if request.data.get('role') == 'athlete' else None,
            position=request.data.get('position') if request.data.get('role') == 'athlete' else None,
            company=request.data.get('company') if request.data.get('role') == 'recruiter' else None,
            job_title=request.data.get('job_title') if request.data.get('role') == 'recruiter' else None,
            city=request.data.get('city', "Global"),
            role=request.data.get('role', "athlete"),
            skills={
                "Velocidad": 80,
                "Táctica": 75,
                "Resistencia": 85,
                "Remate": 70,
                "Control": 80,
                "Visión de Juego": 75
            } if request.data.get('role') == 'athlete' else {},
            achievements=["Nuevo Miembro de SportHub"]
        )
        user.save()
        
        # 🌐 SIGNAL REAL-TIME: Notificar cambio en analítica global (Nueva incorporación)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'presence',
                {
                    'type': 'analytics_update',
                    'data': {
                        'trigger': 'new_user',
                        'role': user.role,
                        'sport': user.sport
                    }
                }
            )
        except Exception as e:
            print(f"WS broadcast registration error: {e}")

        # Generamos tokens de inmediato para loguear tras registro
        tokens = generate_tokens_for_user(user)
        return Response({
            "detail": "Usuario registrado con éxito",
            "tokens": tokens
        }, status=201)

