import os
import django
import random
from datetime import datetime, timedelta
from bson import ObjectId

# Interfaz de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User, AnalyticsEvent, Post, Comment

def seed_database():
    print("Iniciando Seed de la Base de Datos V2.1 con Activos Locales...")

    # Limpiar colecciones previas
    User.objects.delete()
    AnalyticsEvent.objects.delete()
    Post.objects.delete()
    
    users = []
    sports = ['Fútbol', 'Basquetbol', 'Tenis', 'Natación', 'Atletismo']
    cities = ['Madrid', 'Bogotá', 'México DF', 'Buenos Aires', 'Santiago']
    roles = ['athlete', 'athlete', 'athlete', 'scout', 'nutritionist', 'coach']
    
    # Crear 20 usuarios para pruebas rápidas y controladas
    for i in range(20):
        role = random.choice(roles)
        sport = random.choice(sports)
        
        avatar = "/test_media/perfil10.jpeg" if i % 2 == 0 else "/test_media/perfil13.jpeg"

        user = User(
            email=f"usuario{i}@sporthub.com",
            password="hashed_password_mock",
            name=f"Nombre Test {i}",
            age=random.randint(18, 45),
            sport=sport,
            city=random.choice(cities),
            bio=f"Bio del usuario {i}",
            role=role,
            skills={"Velocidad": 80, "Táctica": 75} if role == 'athlete' else {}
        )
        user.save()
        users.append(user)

    # Atleta 0 (Principal - Santiago)
    atleta0 = users[0]
    atleta0.email = "atleta0@sporthub.com"
    atleta0.name = "Santiago Atleta"
    atleta0.save()

    # Atleta 1 (Prueba de Fuego - Multisesión)
    atleta1 = users[1]
    atleta1.email = "usuario1@sporthub.com"
    atleta1.name = "Atleta de Prueba 1"
    atleta1.save()

    # Atleta 4 (Para flujo E2E anterior)
    atleta4 = users[4]
    atleta4.name = "Nombre Test 4"
    atleta4.save()

    print("Usuarios creados. Generando Posts con Multimedia Local...")

    # Post 1: Video en el Feed
    Post(
        author=atleta4,
        content="¡Mira mi último entrenamiento de hoy! 🎥 #basket #entrenamiento",
        media_url="/test_media/vid1.mp4",
        timestamp=datetime.utcnow()
    ).save()

    # Post 2: Fútbol
    Post(
        author=users[1],
        content="Partidazo el de ayer. ⚽",
        media_url="/test_media/fut1.jpg",
        timestamp=datetime.utcnow() - timedelta(hours=1)
    ).save()

    # Post 3: Basket
    Post(
        author=users[2],
        content="Tirando unas canastas. 🏀",
        media_url="/test_media/bas1.jpeg",
        timestamp=datetime.utcnow() - timedelta(hours=2)
    ).save()

    # Generar Analítica para Atleta 0 y Atleta 1 (Vistas)
    profiles_to_track = [atleta0, atleta1]
    
    for profile in profiles_to_track:
        # Generar entre 15 y 30 visitas aleatorias por perfil
        for _ in range(random.randint(15, 30)):
            AnalyticsEvent.register_visit(
                visited_id=profile.id,
                visitor_age=random.randint(15, 60)
            )

    print("Seed V2.1 Completado con Datos de Analítica.")

if __name__ == "__main__":
    seed_database()
