import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from django.test import Client
from core.models import User

def run_integration_test():
    client = Client()
    
    # Obtener dos usuarios de la base de datos (de los 50 insertados previamente)
    # Por si acaso, lo hacemos con un iterador
    users_qs = list(User.objects.limit(2))
    if len(users_qs) < 2:
        print("La base de datos no tiene suficientes usuarios. Corriendo semilla primero si pasa esto.")
        return
        
    sender = users_qs[0]
    receiver = users_qs[1]
    
    print(f"--- TEST DE INTEGRACIÓN: API SOCIAL Y MENSAJERÍA ---")
    print(f"\nUser A (Sender): {sender.name} ({sender.id})")
    print(f"User B (Receiver): {receiver.name} ({receiver.id})")

    # 1. Test Fail de seguirse a sí mismo
    print("\n1. Probando regla: Un usuario no puede seguirse a sí mismo.")
    res_self = client.post(
        '/api/social/follow/',
        {'target_id': str(sender.id)},
        HTTP_X_USER_ID=str(sender.id)
    )
    print(f"Resultado: {res_self.status_code} - Respuesta: {res_self.json()}")

    # 2. Test Follow
    print("\n2. User A sigue a User B.")
    res_follow = client.post(
        '/api/social/follow/',
        {'target_id': str(receiver.id)},
        HTTP_X_USER_ID=str(sender.id)
    )
    print(f"Resultado: {res_follow.status_code} - Respuesta: {res_follow.json()}")

    # Modificar/verificar DB
    sender.reload()
    receiver.reload()
    print(f" -> En DB: User A sigue a {len(sender.following)} personas.")
    print(f" -> En DB: User B tiene {len(receiver.followers)} seguidores.")

    # 3. Test Mensaje
    print("\n3. User A envía mensaje a User B.")
    res_msg = client.post(
        '/api/messages/send/',
        {'receiver_id': str(receiver.id), 'body': '¡Excelente entrenamiento!'},
        HTTP_X_USER_ID=str(sender.id)
    )
    print(f"Resultado: {res_msg.status_code} - Respuesta: {res_msg.json()}")

    # 4. Test Inbox (Verificar que User B tiene el mensaje)
    print("\n4. Revisando Inbox de User B.")
    res_inbox = client.get(
        '/api/messages/inbox/',
        HTTP_X_USER_ID=str(receiver.id)
    )
    print(f"Resultado: {res_inbox.status_code}")
    print("Contenido devuelto:")
    print(json.dumps(res_inbox.json(), indent=4, ensure_ascii=False))
    
    print("\nPruebas Integrales Exitosas.")

if __name__ == '__main__':
    run_integration_test()
