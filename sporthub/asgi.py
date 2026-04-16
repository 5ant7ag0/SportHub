"""
ASGI config for sporthub project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

# 1. Configurar el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')

# 2. Inicializar Django (Crítico para que Channels encuentre las apps)
django.setup()

# 3. Obtener la aplicación ASGI base
django_asgi_app = get_asgi_application()

# 4. Importar routing después de django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from core.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(
        websocket_urlpatterns
    ),
})
