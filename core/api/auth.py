from datetime import datetime
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from core.models import User
from bson.errors import InvalidId

class MongoJWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication for MongoEngine.
    Extrae el Bearer token, lo decodifica usando SimpleJWT y devuelve el Mongo Document User.
    """
    def authenticate(self, request):
        try:
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return None
                
            token = auth_header.split(' ')[1]
            
            try:
                # Validamos y decodificamos el JWT
                validated_token = AccessToken(token)
                
                # SimpleJWT permite custom claims. Obtendremos request.user usando user_id 
                user_id = validated_token.get('user_id')
                if not user_id:
                    raise AuthenticationFailed('Token no contiene identificador válido de usuario.')
                    
                user = User.objects.get(id=user_id)
                # Rastreo atómico de actividad blindado
                try:
                    user.update(set__last_activity=datetime.utcnow())
                except Exception as e:
                    print(f"Error actualizando last_activity para {user_id}: {e}")
                    
                return (user, validated_token)
                
            except (TokenError, InvalidToken):
                raise AuthenticationFailed('Token inválido o expirado.')
            except (User.DoesNotExist, InvalidId):
                raise AuthenticationFailed('Usuario asociado al token no existe.')
        except AuthenticationFailed:
            raise
        except Exception as e:
            print(f"ERROR CRÍTICO EN AUTENTICACIÓN: {e}")
            return None

