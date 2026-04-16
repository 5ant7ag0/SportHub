import os
import django

# Configuración del entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User, Message
from mongoengine import Q

def cleanup():
    print("--- INICIANDO LIMPIEZA DE MENSAJERÍA ---")
    
    # 1. Borrar Automensajes (sender == receiver)
    # Estos ensucian el inbox y no aportan valor real
    self_messages = Message.objects(sender__exists=True, receiver__exists=True)
    deleted_count = 0
    for msg in self_messages:
        try:
            if str(msg.sender.id) == str(msg.receiver.id):
                msg.delete()
                deleted_count += 1
        except: continue
    print(f"-> Automensajes eliminados: {deleted_count}")
    
    # 2. Limpiar active_chats en todos los usuarios
    # Quitaremos a los usuarios de sus propias listas y prepararemos para el nuevo filtro
    total_users = User.objects.count()
    cleaned_active_chats = 0
    for user in User.objects:
        if user.active_chats:
            original_len = len(user.active_chats)
            # Solo mantener usuarios distintos a uno mismo que sean válidos
            user.active_chats = [u for u in user.active_chats if u and str(u.id) != str(user.id)]
            if len(user.active_chats) != original_len:
                user.save()
                cleaned_active_chats += 1
    print(f"-> Usuarios con active_chats saneado: {cleaned_active_chats}")
    
    print("--- LIMPIEZA COMPLETADA ---")

if __name__ == "__main__":
    cleanup()
