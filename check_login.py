import requests
import json

def test_login():
    url = "http://localhost:8000/api/login/"
    payload = {
        "email": "atleta0@sporthub.com",
        "password": "hashed_password_mock"
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"--- Probando Login en {url} ---")
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS] Login Exitoso!")
            print(f"Access Token: {data.get('access')[:50]}...")
            print(f"Refresh Token: {data.get('refresh')[:50]}...")
        else:
            print(f"[FAILED] Error: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] No se pudo conectar al servidor: {e}")

if __name__ == "__main__":
    test_login()
