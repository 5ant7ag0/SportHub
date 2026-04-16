import os
import django
import random
from datetime import datetime, timedelta

# Interfaz de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User, AnalyticsEvent, Post, Comment
import math

def seed_database():
    print("Iniciando Seed de la Base de Datos V2.0...")

    # Limpiar colecciones previas
    User.objects.delete()
    AnalyticsEvent.objects.delete()
    Post.objects.delete()
    
    print("Creando 100 usuarios Multi-Rol...")
    users = []
    sports = ['Fútbol', 'Basquetbol', 'Tenis', 'Natación', 'Atletismo']
    cities = ['Madrid', 'Bogotá', 'México DF', 'Buenos Aires', 'Santiago']
    roles = ['athlete', 'athlete', 'athlete', 'scout', 'nutritionist', 'coach']
    
    achievements_pool = [
        "Campeón Regional 2023", "Medalla de Oro Estatal", "Top 10 Nacional", 
        "MVP de la Temporada", "Mejor Tiempo Libre", "Certificación Élite"
    ]

    for i in range(100):
        # Distribución de edades para ver estadísticas interesantes
        age = random.randint(15, 65)
        # Calcular fecha de nacimiento aproximada
        birth_date = datetime.utcnow() - timedelta(days=age*365.25 + random.randint(0, 364))
        role = random.choice(roles)
        sport = random.choice(sports)
        
        bio = f"Apasionado del {sport}. Dedicando 6 horas diarias al perfeccionamiento técnico. Buscando grandes oportunidades en la red."
        if role == 'scout':
            bio = f"Cazatalentos especializado en {sport}. Observando a la próxima generación de élite."
        elif role == 'nutritionist':
            bio = f"Experto en recuperación y dietética deportiva para alto rendimiento."
            
        skills = {
            "Velocidad": random.randint(50, 99),
            "Resistencia": random.randint(50, 99),
            "Fuerza": random.randint(50, 99),
            "Táctica": random.randint(50, 99)
        } if role == 'athlete' else {}
        
        achievements = random.sample(achievements_pool, random.randint(0, 3)) if role == 'athlete' else []

        user = User(
            email=f"usuario{i}@sporthub.com",
            password="hashed_password_mock",
            name=f"Nombre Test {i}",
            birth_date=birth_date,
            sport=sport,
            city=random.choice(cities),
            bio=bio,
            role=role,
            skills=skills,
            achievements=achievements
        )
        user.save()
        users.append(user)

    print(f"{User.objects.count()} Usuarios creados exitosamente.")

    # Conectar algunos usuarios entre sí (Networking)
    print("Generando conexiones (Followers)...")
    for u in users:
        # Seguir aleatoriamente a otros 5-15 usuarios
        to_follow = random.sample([x for x in users if x.id != u.id], random.randint(5, 15))
        for target in to_follow:
            u.update(push__following=target)
            target.update(push__followers=u)
            
    # Asignaremos una cuenta específica con email fácil para login: "atleta0@sporthub.com" garantizando que es atleta
    seed_athlete = users[0]
    seed_athlete.email = "atleta0@sporthub.com"
    seed_athlete.role = "athlete"
    seed_athlete.name = "Santiago Atleta"
    seed_athlete.save()
            
    target_profile = seed_athlete
    print(f"Generando 100 visitas al perfil de {target_profile.name} (ID: {target_profile.id})...")

    # Insertamos 100 analíticas de visitas, simulando usuarios con distintas edades
    for i in range(100):
        visitor = random.choice(users)
        random_days_ago = random.randint(0, 14)
        timestamp = datetime.utcnow() - timedelta(days=random_days_ago)

        event = AnalyticsEvent(
            visited_profile_id=target_profile.id,
            visitor_age=visitor.computed_age,
            timestamp=timestamp
        )
        event.save()

    print(f"{AnalyticsEvent.objects.count()} Eventos de analíticas insertados.")

    print("\nGenerando 40 Publicaciones (Posts) Reales con Interacciones...")
    
    post_contents = [
        "¡Excelente sesión de entrenamiento hoy! Pulverizando tiempos personales en 100m. 🏊‍♂️💪 #entrenamiento",
        "Análisis táctico: ¿alguien más considera que el rendimiento disminuye un 15% en canchas de césped sintético? ⚽",
        "Regresando de una lesión doble de tobillo. La rehabilitación física es el 80% del éxito en el deporte profesional. 🙏",
        "Estadísticas de mi último juego: 15 asistencias, 8 rebotes. ¡Creciendo el engagement! 🏀",
        "Mi nuevo setup de entrenamiento en altura. La oxigenación es clave. 🏔️🏃",
        "Probando una nueva dieta basada en plantas durante mi mes competitivo. #Nutricion",
        "Imparable en el último torneo regional. ¡Vamos por la final este domingo!",
        "La psicología deportiva cambió radicalmente mi enfoque en los últimos minutos de un juego apretado."
    ]
    
    for i in range(40):
        author = random.choice(users)
        post = Post(
            author=author,
            content=random.choice(post_contents),
            timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 120))
        )
        post.save()
        
        # Añadir de 2 a 25 likes aleatorios
        likers = random.sample(users, random.randint(2, 25))
        for liker in likers:
            post.update(push__likes=liker)
            
        # Añadir algunos comentarios embebidos
        for _ in range(random.randint(0, 5)):
            comment_author = random.choice(users)
            comment = Comment(
                author=comment_author,
                text="¡Totalmente de acuerdo, tremendo trabajo! 🔥",
                timestamp=datetime.utcnow()
            )
            post.update(push__comments=comment)

    print(f"{Post.objects.count()} Posts creados con likes y comentarios.")

    print("\nSeed V2 Completado. Cuenta Atleta Principal: atleta0@sporthub.com")

if __name__ == "__main__":
    seed_database()
