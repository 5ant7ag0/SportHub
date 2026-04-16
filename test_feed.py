import requests

print("Iniciando prueba...")
try:
    r = requests.post('http://127.0.0.1:8000/api/auth/token/obtain/', json={'email': 'atleta0@sporthub.com', 'password': 'hashed_password_mock'})
    print("Login:", r.status_code, r.text[:200])
    token = r.json().get('access')
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        r2 = requests.get('http://127.0.0.1:8000/api/feed/', headers=headers)
        print("Feed:", r2.status_code, r2.text[:200])
        r3 = requests.get('http://127.0.0.1:8000/api/profile/', headers=headers)
        print("Profile:", r3.status_code, r3.text[:200])
except Exception as e:
    print("Error:", e)
