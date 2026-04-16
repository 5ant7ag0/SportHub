import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_flow():
    print("--- Iniciando Auditoría de Mensajería ---")
    
    # 1. Obtener Token para Atleta 0
    login_data = {
        "email": "atleta0@sporthub.com",
        "password": "hashed_password_mock"
    }
    r = requests.post(f"{BASE_URL}/auth/token/obtain/", json=login_data)
    if r.status_code != 200:
        print(f"FAILED: Login falló ({r.status_code})")
        return
    
    token = r.json().get('access')
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS: Token obtenido para Atleta 0.")

    # 2. Obtener ID de Usuario 1 (Simulando búsqueda)
    r = requests.get(f"{BASE_URL}/search/?q=usuario1", headers=headers)
    if r.status_code != 200 or not r.json():
        print("FAILED: No se pudo encontrar a Usuario 1.")
        return
    
    u1_id = r.json()[0]['id']
    print(f"SUCCESS: ID de Usuario 1 detectado: {u1_id}")

    # 3. Enviar Mensaje 'Fantasma'
    msg_data = {
        "receiver_id": u1_id,
        "body": "Mensaje de Auditoría E2E: SportHub está listo para producción."
    }
    r = requests.post(f"{BASE_URL}/messages/send/", data=msg_data, headers=headers)
    
    if r.status_code == 201:
        print("SUCCESS: Mensaje enviado (201 Created).")
    else:
        print(f"FAILED: Error al enviar mensaje ({r.status_code}): {r.text}")
        return

    # 4. Verificar en el Inbox
    r = requests.get(f"{BASE_URL}/messages/inbox/", headers=headers)
    messages = r.json()
    last_msg = next((m for m in messages if m['receiver_id'] == u1_id), None)
    
    if last_msg:
        print(f"SUCCESS: Mensaje persistido en MongoDB. Contenido: '{last_msg['body']}'")
    else:
        print("FAILED: El mensaje no aparece en la bandeja de salida/entrada.")

if __name__ == "__main__":
    test_flow()
