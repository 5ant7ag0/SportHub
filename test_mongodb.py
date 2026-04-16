import os
import django

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")

# Setup Django, which will trigger the settings.py and connect MongoEngine
django.setup()

import mongoengine

try:
    # Get the default connection
    conn = mongoengine.get_connection()
    # Ping the server to verify connection
    server_info = conn.server_info()
    print("✅ Conexión exitosa a la base de datos MongoDB (MongoEngine)!")
    print(f"Información del servidor: MongoDB {server_info.get('version')}")
except Exception as e:
    print(f"❌ Error al conectar con MongoDB: {e}")
