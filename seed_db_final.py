import os
import django
import random
from datetime import datetime, timedelta
from bson import ObjectId

# Interfaz de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User, Post, Message, AnalyticsEvent, Comment

def seed_database():
    print("🚀 Iniciando Seeding Final de SportHub: Activación Total...")

    # 1. Limpieza Atómica de Colecciones
    User.objects.delete()
    Post.objects.delete()
    Message.objects.delete()
    AnalyticsEvent.objects.delete()
    
    print("🧹 Base de Datos NoSQL Limpia.")

    # 2. Definición de Atletas Élite (5 Usuarios)
    athletes_data = [
        {
            "name": "Entrenador Juan",
            "email": "juan@sporthub.com",
            "sport": "Fútbol",
            "role": "coach",
            "avatar": "/test_media/perfil10.jpeg",
            "bio": "Entrenador certificado UEFA Pro. Especialista en táctica avanzada y desarrollo de talento joven.",
            "city": "Madrid"
        },
        {
            "name": "Scout Nike",
            "email": "scout@nike.com",
            "sport": "Basquetbol",
            "role": "scout",
            "avatar": "/test_media/perfil13.jpeg",
            "bio": "Buscando la próxima estrella de la NBA en Latinoamérica. Interesado en pivots con gran envergadura.",
            "city": "Chicago"
        },
        {
            "name": "Dra. Ana Martínez",
            "email": "ana@nutrition.com",
            "sport": "Atletismo",
            "role": "nutritionist",
            "avatar": "/test_media/sample_atleta.svg",
            "bio": "Nutricionista deportiva enfocada en alto rendimiento y optimización metabólica.",
            "city": "Barcelona"
        },
        {
            "name": "Miguel Torres",
            "email": "miguel@sporthub.com",
            "sport": "Fútbol",
            "role": "athlete",
            "avatar": "/test_media/perfil10.jpeg",
            "bio": "Mediocampista creativo. Ex-cantera de equipos profesionales. Buscando equipo en Segunda División.",
            "city": "CDMX"
        },
        {
            "name": "Sofia Herrera",
            "email": "sofia@sporthub.com",
            "sport": "Basquetbol",
            "role": "athlete",
            "avatar": "/test_media/perfil13.jpeg",
            "bio": "Base armadora. Campeona nacional universitaria. Lista para el siguiente nivel professional.",
            "city": "Bogotá"
        }
    ]

    users = []
    for data in athletes_data:
        user = User(
            email=data["email"],
            password="hashed_password_mock",
            name=data["name"],
            age=random.randint(22, 35),
            sport=data["sport"],
            role=data["role"],
            avatar_url=data["avatar"],
            bio=data["bio"],
            city=data["city"],
            skills={"Fuerza": 85, "Velocidad": 70, "Técnica": 90}
        )
        user.save()
        users.append(user)
    
    atleta_juan = users[0]
    scout_nike = users[1]
    dra_ana = users[2]
    miguel = users[3]
    sofia = users[4]

    print("👥 5 Atletas Élite Creados con Éxito.")

    # 3. Publicaciones Multimedia (Requerimiento: Video, Foto, Texto)
    
    # Juan (Video)
    Post(
        author=atleta_juan,
        content="Analizando la sesión matutina. La presión tras pérdida es la clave de nuestro sistema. 🎥⚽",
        media_url="/test_media/vid1.mp4",
        timestamp=datetime.utcnow() - timedelta(hours=5)
    ).save()

    # Scout Nike (Foto)
    Post(
        author=scout_nike,
        content="Gran ambiente hoy en las pruebas regionales. Mucho talento por pulir. 🏀🔥",
        media_url="/test_media/bas1.jpeg",
        timestamp=datetime.utcnow() - timedelta(hours=3)
    ).save()

    # Dra Ana (Texto)
    Post(
        author=dra_ana,
        content="Recuerden: La hidratación comienza 24 horas antes de la competición, no 2 minutos antes. 💧🥗",
        timestamp=datetime.utcnow() - timedelta(hours=1)
    ).save()

    # Miguel (Foto Fútbol)
    Post(
        author=miguel,
        content="Extrañando el césped. ¡Pronto de vuelta! ⚽🥅",
        media_url="/test_media/fut1.jpg",
        timestamp=datetime.utcnow() - timedelta(days=1)
    ).save()

    print("📝 Publicaciones Multimedia Generadas.")

    # 4. Sistema de Seguidores (Cálculo de Contadores)
    # Juan sigue a Miguel y Sofia
    atleta_juan.update(add_to_set__following=[miguel, sofia])
    miguel.update(add_to_set__followers=atleta_juan)
    sofia.update(add_to_set__followers=atleta_juan)

    # Scout Nike sigue a Sofia
    scout_nike.update(add_to_set__following=sofia)
    sofia.update(add_to_set__followers=scout_nike)

    # Sofia sigue a Juan (Reciprocidad)
    sofia.update(add_to_set__following=atleta_juan)
    atleta_juan.update(add_to_set__followers=sofia)

    print("🔗 Conexiones Sociales Iniciales Establecidas.")

    # 5. Mensajería de Bienvenida (Inter-seguimiento)
    Message(
        sender=scout_nike,
        receiver=sofia,
        body="Hola Sofia, me impresionó tu desempeño en el torneo nacional. ¿Tienes disponibilidad para una charla técnica?"
    ).save()

    Message(
        sender=atleta_juan,
        receiver=miguel,
        body="Miguel, revisé tu video. Tienes buen posicionamiento, pero debemos trabajar en el cambio de ritmo."
    ).save()

    print("💬 Hilos de Conversación Iniciales Creados.")
    print("✅ Seed Final Completado. SportHub está listo para la acción.")

if __name__ == "__main__":
    seed_database()
