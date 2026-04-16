
import os
import django
from bson import ObjectId

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User, Message

def verify_conversation():
    print("Iniciando Verificación de Mensajería...")
    
    # Obtener dos usuarios de prueba
    users = User.objects.all()[:2]
    if len(users) < 2:
        print("Error: Se necesitan al menos 2 usuarios en la DB.")
        return

    alice, bob = users[0], users[1]
    print(f"Alice: {alice.name} ({alice.id})")
    print(f"Bob: {bob.name} ({bob.id})")

    # 1. Simular envío de mensaje (Lógica manual de lo que haría SendMessageView)
    msg_body = "Mensaje de prueba automatizado"
    msg = Message(sender=alice, receiver=bob, body=msg_body)
    msg.save()
    print(f"Mensaje enviado de Alice a Bob: {msg.id}")

    # 2. Verificar recuperación de conversación (Lo que haría ConversationDetailView)
    history = Message.objects(
        ((Message.sender == alice) & (Message.receiver == bob)) |
        ((Message.sender == bob) & (Message.receiver == alice))
    ).order_by('timestamp')

    print(f"Mensajes encontrados en la conversación: {len(history)}")
    
    found = any(m.body == msg_body for m in history)
    if found:
        print("SUCCESS: El mensaje fue persistido y recuperado correctamente.")
    else:
        print("FAILURE: El mensaje no aparece en el historial.")

if __name__ == "__main__":
    verify_conversation()
