import os
import django
from mongoengine import connect, Q

# Configuración de Django para acceder al modelo User
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def sanitize_db():
    print("--- INICIANDO SANITIZACIÓN DE MONGODB ---")
    
    users = User.objects.all()
    count = 0
    
    for user in users:
        updated = False
        
        # Campos básicos de texto
        if not user.bio:
            user.bio = "Atleta apasionado de SportHub."
            updated = True
        if not user.sport:
            user.sport = "Deportista Multi-disciplina"
            updated = True
        if not user.position:
            user.position = "Pro Player"
            updated = True
        if not user.city:
            user.city = "Global"
            updated = True
            
        # Campos de estructura (Skills y Achievements)
        if user.skills is None or not isinstance(user.skills, dict):
            user.skills = {
                "Velocidad": 80,
                "Táctica": 75,
                "Resistencia": 85,
                "Remate": 70,
                "Control": 80,
                "Visión de Juego": 75
            }
            updated = True
            
        if user.achievements is None or not isinstance(user.achievements, list):
            user.achievements = ["Miembro Fundador de SportHub"]
            updated = True
            
        if updated:
            user.save()
            count += 1
            print(f"SUCCESS: Usuario '{user.email}' sanitizado.")
            
    print(f"--- SANITIZACIÓN COMPLETADA. Usuarios actualizados: {count} ---")

if __name__ == "__main__":
    sanitize_db()
