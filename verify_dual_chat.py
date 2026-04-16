import requests
import time

BASE_URL = 'http://localhost:8000/api'

def get_token(email, password):
    r = requests.post(f"{BASE_URL}/auth/token/obtain/", json={"email": email, "password": password})
    return r.json().get('access') if r.status_code == 200 else None

def get_profile(token):
    r = requests.get(f"{BASE_URL}/profile/", headers={"Authorization": f"Bearer {token}"})
    return r.json() if r.status_code == 200 else None

def send_msg(token, receiver_id, body):
    r = requests.post(f"{BASE_URL}/messages/send/", data={"receiver_id": receiver_id, "body": body}, headers={"Authorization": f"Bearer {token}"})
    return r.status_code == 201

def check_inbox(token):
    r = requests.get(f"{BASE_URL}/messages/inbox/", headers={"Authorization": f"Bearer {token}"})
    return r.json() if r.status_code == 200 else []

def test_dual_flow():
    print("--- INICIANDO AUDITORÍA DUAL DE MENSAJERÍA ---")
    
    # 1. Login Atleta 0
    token0 = get_token("atleta0@sporthub.com", "hashed_password_mock")
    prof0 = get_profile(token0)
    print(f"DEBUG: Atleta 0 Loggeado (ID: {prof0['id']})")

    # 2. Login Atleta 1 (usuario1)
    token1 = get_token("usuario1@sporthub.com", "hashed_password_mock")
    prof1 = get_profile(token1)
    print(f"DEBUG: Atleta 1 Loggeado (ID: {prof1['id']})")

    # 3. Atleta 0 envía a Atleta 1
    test_msg = f"Dual Test Message - {time.time()}"
    if send_msg(token0, prof1['id'], test_msg):
        print(f"SUCCESS: Atleta 0 envió: '{test_msg}'")
    else:
        print("FAILED: Atleta 0 no pudo enviar mensaje.")
        return

    # 4. Atleta 1 verifica recepción
    inbox1 = check_inbox(token1)
    received = next((m for m in inbox1 if m['body'] == test_msg), None)
    if received:
        print(f"SUCCESS: Atleta 1 recibió el mensaje de Atleta 0 correctamente.")
    else:
        print("FAILED: Atleta 1 no tiene el mensaje en su inbox.")
        return

    # 5. Atleta 1 responde a Atleta 0
    reply_msg = "Recibido Atleta 0. SportHub Dual Chat OK."
    if send_msg(token1, prof0['id'], reply_msg):
        print(f"SUCCESS: Atleta 1 respondió: '{reply_msg}'")
    else:
        print("FAILED: Atleta 1 no pudo responder.")
        return

    # 6. Atleta 0 verifica respuesta
    inbox0 = check_inbox(token0)
    received_reply = next((m for m in inbox0 if m['body'] == reply_msg), None)
    if received_reply:
        print(f"SUCCESS: Atleta 0 recibió la respuesta. FLUJO COMPLETO VALIDADO.")
    else:
        print("FAILED: Atleta 0 no recibió la respuesta.")

if __name__ == "__main__":
    test_dual_flow()
