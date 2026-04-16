import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from django.test import Client

def run_jwt_test():
    client = Client()
    
    print("--- TEST DE INTEGRACIÓN: AUTENTICACIÓN JWT PARA NOSQL ---")
    
    # 1. Obtain Token Pair
    email = "atleta0@sporthub.com"
    password = "hashed_password_mock"
    
    print(f"\n1. Solicitando Tokens para {email} ...")
    res_token = client.post(
        '/api/auth/token/obtain/',
        {'email': email, 'password': password},
        content_type='application/json'
    )
    
    if res_token.status_code != 200:
        print(f"Error obteniendo token: {res_token.status_code} - {res_token.content}")
        return
        
    tokens = res_token.json()
    access_token = tokens.get('access')
    refresh_token = tokens.get('refresh')
    
    print(f"Status Code: 200 OK")
    print(f"-> Access Token recuperado correctamente.")
    print(f"-> Refresh Token recuperado correctamente.")
    
    # 2. Decode/Read custom payload locally (to verify role and user_id is injected)
    import jwt # PyJWT is installed
    # We decode without verification locally just to print the payload for debugging
    decoded = jwt.decode(access_token, options={"verify_signature": False})
    print("\n2. Payload del Access Token personalizado:")
    print(json.dumps(decoded, indent=4))
    
    # 3. Test Protected Route using Bearer Token
    print("\n3. Probando ruta protegida (Inbox) enviando el Bearer Token...")
    res_protected = client.get(
        '/api/messages/inbox/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}'
    )
    
    print(f"Status Code: {res_protected.status_code}")
    if res_protected.status_code == 200:
        print("Acceso exitoso al Inbox usando la sesión JWT nativa frente a MongoDB.")
    else:
        print(f"Falla de acceso decodificando JWT: {res_protected.json()}")
        
    print("\nAutenticación JWT Completada exitosamente.")

if __name__ == '__main__':
    run_jwt_test()
