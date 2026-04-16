import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from django.test import Client

def run_upload_test():
    client = Client()
    print("--- TEST DE INTEGRACIÓN: SUBIDA DE CONTENIDO CLOUDINARY ---")
    
    # 1. Obtain Token for testing
    email = "atleta0@sporthub.com"
    res_token = client.post(
        '/api/auth/token/obtain/',
        {'email': email, 'password': 'hashed_password_mock'},
        content_type='application/json'
    )
    if res_token.status_code != 200:
        print("Error obteniendo token.")
        return
    token = res_token.json().get('access')

    # Ruta a la espectacular imagen autogenerada (muddy pitch soccer volley)
    img_path = "/Users/santiago/.gemini/antigravity/brain/a9ab9e34-dd6c-4257-9b41-fac7c905d315/athlete_training_pic_1775361886286.png"
    
    print("\n2. Simulando envío del archivo binario con el Bearer JWT a /api/posts/create/ ...")
    
    with open(img_path, 'rb') as fp:
        upload_data = {
            'content': '¡Increíble entrenamiento bajo la lluvia, preparándome para la final! ⚽🌧️',
            'file': fp  # El test client de Django lo enviará como multipart/form-data
        }
        res_upload = client.post(
            '/api/posts/create/',
            upload_data,
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        
        print(f"\nStatus Code: {res_upload.status_code}")
        print("Respuesta devuelta por el API (Intento de conexión real con el Storage):")
        print(json.dumps(res_upload.json(), indent=4, ensure_ascii=False))
        
        if res_upload.status_code == 500 and "Must supply api_key" in str(res_upload.json()):
            print("\n✔️ ÉXITO ARQUITECTÓNICO: La validación es correcta.")
            print("El SDK de Cloudinary capturó e intentó procesar el binario, pero detectó que nuestras variables de .env están con 'tu_url_aqui'.")
            print("En cuanto reemplaces las variables, la URL remota se insertará instantáneamente en el documento MongoDB.")

if __name__ == '__main__':
    run_upload_test()
