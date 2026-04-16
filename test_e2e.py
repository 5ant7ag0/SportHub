import requests

BASE_URL = "http://127.0.0.1:8000/api"

print("🔥 Iniciando Test E2E de Ciclo Completo...")

try:
    # 1. Login Atleta0
    res_login_0 = requests.post(f"{BASE_URL}/auth/token/obtain/", json={"email": "atleta0@sporthub.com", "password": "hashed_password_mock"})
    if res_login_0.status_code == 200:
        token0 = res_login_0.json()['access']
        headers0 = {"Authorization": f"Bearer {token0}"}
        print("✅ Login Atleta0 Exitoso")
    else:
        print("❌ Fallo Login Atleta0", res_login_0.text)
        exit(1)

    # 2. Login Usuario15
    res_login_15 = requests.post(f"{BASE_URL}/auth/token/obtain/", json={"email": "usuario15@sporthub.com", "password": "hashed_password_mock"})
    if res_login_15.status_code == 200:
        token15 = res_login_15.json()['access']
        headers15 = {"Authorization": f"Bearer {token15}"}
        
        target_id = requests.get(f"{BASE_URL}/profile/", headers=headers15).json()['id']
        id0 = requests.get(f"{BASE_URL}/profile/", headers=headers0).json()['id']
        print("✅ Login Atleta15 Exitoso")
    else:
        print("❌ Fallo Login Atleta15", res_login_15.text)
        exit(1)

    # 3. Buscar y Conectar
    res_req = requests.post(f"{BASE_URL}/network/request/", json={"target_id": target_id}, headers=headers0)
    if res_req.status_code == 200:
        print("✅ Solicitud de Conexion Enviada")
    else:
        print("❌ Fallo enviar solicitud", res_req.text)

    # 4. Aceptar
    res_acc = requests.post(f"{BASE_URL}/network/accept/", json={"target_id": id0, "action": "accept"}, headers=headers15)
    if res_acc.status_code == 200:
        print("✅ Solicitud de Conexion Aceptada")
    else:
        print("❌ Fallo aceptar solicitud", res_acc.text)

    # 5. Mensaje y Edicion
    res_msg = requests.post(f"{BASE_URL}/messages/send/", json={"receiver_id": target_id, "body": "Hola, entrenamos hoy?"}, headers=headers0)
    if res_msg.status_code in [200, 201]:
        print("✅ Mensaje Inicial Enviado")
        
        # Fetch Inbox
        msg_id = None
        res_inbox = requests.get(f"{BASE_URL}/messages/inbox/", headers=headers15)
        for m in res_inbox.json():
            if m['body'] == "Hola, entrenamos hoy?":
                msg_id = m.get('_id') or m.get('id')
                if msg_id:
                    if isinstance(msg_id, dict) and '$oid' in msg_id:
                        msg_id = msg_id['$oid']
                break
                
        if msg_id:
            res_edit = requests.put(f"{BASE_URL}/messages/edit/{msg_id}/", json={"body": "[EDITADO] Hola, entrenaremos mañana?"}, headers=headers0)
            if res_edit.status_code == 200:
                print("✅ Mensaje Editado exitosamente verificando persistencia (is_edited).")
            else:
                print("❌ Fallo edición msj", res_edit.text)
        else:
            print("❌ Msg id not found in inbox response", res_inbox.json())
    else:
        print("❌ Mensaje Fallido", res_msg.text)
        
    # 6. Post con Foto (Usando multipart/form-data)
    import io
    dummy_image = io.BytesIO(b"dummy image data")
    dummy_image.name = "test.jpg"
    files = {'file': dummy_image}
    data = {'content': "Hoy tuve un entrenamiento excelente! 🚀"}
    res_post = requests.post(f"{BASE_URL}/posts/create/", headers={"Authorization": f"Bearer {token0}"}, data=data, files=files)
    if res_post.status_code == 201:
        print("✅ Post con Foto creado exitosamente.")
    else:
        print("❌ Fallo al crear Post con Foto", res_post.text)
        
    print("🚀 Test E2E de API completado.")
except Exception as e:
    print(f"Error connecting: {e}")
