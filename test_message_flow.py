
import os
import django
from bson import ObjectId

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User, Message

def test_full_flow():
    print("Iniciando Test de Flujo de Mensajería...")
    
    # Obtener dos usuarios
    users = User.objects.all()[:2]
    if len(users) < 2:
        print("Error: Se necesitan al menos 2 usuarios.")
        return

    alice, bob = users[0], users[1]
    
    # Limpiar mensajes previos para el test (opcional, pero mejor ver persistencia real)
    # Message.objects(Q(sender=alice, receiver=bob) | Q(sender=bob, receiver=alice)).delete()

    # 1. Enviar ráfaga de mensajes
    bodies = ["Hola Bob", "Cómo estás?", "Mensaje antiguo 1", "Mensaje antiguo 2"]
    for b in bodies:
        Message(sender=alice, receiver=bob, body=b).save()
        import time
        time.sleep(0.1) # Breve pausa para asegurar timestamps distintos

    # 2. Verificar ConversationDetailView
    from core.api.views import ConversationDetailView
    from rest_framework.request import Request
    from rest_framework.test import APIRequestFactory

    factory = APIRequestFactory()
    request = factory.get(f'/api/messages/conversation/{bob.id}/')
    request.user = alice
    
    view = ConversationDetailView.as_view()
    response = view(request, contact_id=str(bob.id))
    
    print(f"Status: {response.status_code}")
    messages = response.data
    print(f"Total mensajes recuperados: {len(messages)}")
    
    for m in messages:
        print(f"[{m['timestamp']}] {'Me' if m['isMe'] else 'Him'}: {m['body']}")

    if len(messages) >= 4:
        print("SUCCESS: Todos los mensajes (viejos y nuevos) fueron recuperados.")
    else:
        print("FAILURE: Faltan mensajes en el historial.")

if __name__ == "__main__":
    test_full_flow()
