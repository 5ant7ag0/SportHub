import requests

BASE_URL = "http://127.0.0.1:8000/api"

res_login_0 = requests.post(f"{BASE_URL}/auth/token/obtain/", json={"email": "atleta0@sporthub.com", "password": "hashed_password_mock"})
if res_login_0.status_code != 200:
    print(f"Login failed: {res_login_0.text}")
    exit(1)
token0 = res_login_0.json()['access']
headers0 = {"Authorization": f"Bearer {token0}"}

res_inbox = requests.get(f"{BASE_URL}/messages/inbox/", headers=headers0)
print(f"Inbox status: {res_inbox.status_code}")
if res_inbox.status_code == 200:
    data = res_inbox.json()
    if data:
        print(f"Inbox first message keys: {data[0].keys()}")

res_feed = requests.get(f"{BASE_URL}/feed/", headers=headers0)
print(f"Feed status: {res_feed.status_code}")
if res_feed.status_code == 200:
    data = res_feed.json()
    if data:
        print(f"Feed first post keys: {data[0].keys()}")
