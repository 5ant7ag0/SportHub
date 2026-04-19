from mongoengine import (
    Document, EmbeddedDocument, StringField, EmailField, IntField,
    ListField, ReferenceField, EmbeddedDocumentField, BooleanField, 
    DateTimeField, DictField, FloatField
)
from bson import ObjectId
from datetime import datetime

class User(Document):
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    google_id = StringField()
    name = StringField(required=True)
    birth_date = DateTimeField(required=False)
    sport = StringField()
    position = StringField()
    city = StringField()
    avatar_url = StringField(default='/test_media/sample_atleta.svg')
    banner_url = StringField(default='https://images.unsplash.com/photo-1518605368461-1ee7e5302a4e?q=80&w=1200&fit=crop')

    # Perfil Profesional (Reclutadores)
    company = StringField()
    job_title = StringField()
    
    bio = StringField()
    role = StringField(default='athlete')  # athlete, scout, nutritionist, coach
    skills = DictField()
    achievements = ListField(StringField())
    social_links = DictField(default=dict)
    
    # Configuración y Privacidad
    is_private = BooleanField(default=False)
    is_active = BooleanField(default=True)
    is_suspended = BooleanField(default=False)
    notifications_enabled = BooleanField(default=True)
    last_activity = DateTimeField()
    created_at = DateTimeField(default=datetime.utcnow)
    
    @property
    def is_online(self):
        if not self.last_activity:
            return False
        now = datetime.utcnow()
        diff = (now - self.last_activity).total_seconds()
        return diff < 30
    
    # Red Social y Mensajería
    followers = ListField(ReferenceField('self', dbref=False))
    following = ListField(ReferenceField('self', dbref=False))
    pending_connections = ListField(ReferenceField('self', dbref=False))
    saved_posts = ListField(ReferenceField('Post'))
    active_chats = ListField(ReferenceField('self'))

    @property
    def computed_age(self):
        """
        Calcula la edad de forma ultra-resiliente. 
        Maneja nulos, tipos incorrectos (ej. Int residual) y errores de parsing.
        """
        try:
            birth = getattr(self, 'birth_date', None)
            
            # Si no hay fecha, devolvemos 0 (resiliencia para perfiles antiguos)
            if not birth:
                return 0
                
            # Soporte si el dato en DB es un Entero/Float residual (esquema anterior)
            if isinstance(birth, (int, float)):
                return int(birth)
            
            # Soporte si birth_date llegó como String
            if isinstance(birth, str):
                from dateutil import parser
                birth = parser.parse(birth)
            
            # Verificación final de tipo datetime o hasattr 'year'
            if not hasattr(birth, 'year'):
                return 0
                
            now = datetime.utcnow()
            age = now.year - birth.year - ((now.month, now.day) < (birth.month, birth.day))
            return max(0, age)
        except Exception:
            # Fallback absoluto ante cualquier anomalía
            return 0

    @property
    def is_authenticated(self):
        return True

    @classmethod
    def get_sport_distribution(cls):
        """
        Calcula la distribución de usuarios por deporte para métricas globales.
        """
        pipeline = [
            {"$match": {"sport": {"$ne": None, "$exists": True}}},
            {"$group": {"_id": "$sport", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6} # Top 6 deportes
        ]
        return list(cls.objects.aggregate(pipeline))

    @classmethod
    def get_city_distribution(cls):
        """
        Ranking de las ciudades con más usuarios.
        """
        pipeline = [
            {"$match": {"city": {"$ne": None, "$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$city", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        return list(cls.objects.aggregate(pipeline))

    @classmethod
    def get_user_growth_stats(cls):
        """
        Histograma mensual de registros.
        """
        pipeline = [
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        return list(cls.objects.aggregate(pipeline))

    @classmethod
    def get_connection_metrics(cls):
        """
        Estado real de concurrencia: Online vs Offline.
        """
        from datetime import timedelta
        threshold = datetime.utcnow() - timedelta(seconds=30)
        pipeline = [
            {"$facet": {
                "online": [{"$match": {"last_activity": {"$gt": threshold}}}, {"$count": "count"}],
                "offline": [{"$match": {"$or": [
                    {"last_activity": {"$lte": threshold}},
                    {"last_activity": {"$exists": False}},
                    {"last_activity": None}
                ]}}, {"$count": "count"}]
            }}
        ]
        res = list(cls.objects.aggregate(pipeline))[0]
        return {
            "offline": res["offline"][0]["count"] if res["offline"] else 0
        }

    @classmethod
    def get_talent_correlation_stats(cls):
        """
        Cruza datos de todos los usuarios activos con sus publicaciones para el gráfico de dispersión.
        Se eliminan restricciones de rol y cantidad para reflejar la base total.
        """
        pipeline = [
            # Todos los usuarios activos o por defecto
            {"$match": {"is_active": {"$ne": False}}},
            # Contar seguidores
            {
                "$project": {
                    "name": 1,
                    "followers_count": {"$size": {"$ifNull": ["$followers", []]}}
                }
            },
            # Unir con posts para contar actividad
            {
                "$lookup": {
                    "from": "post",
                    "localField": "_id",
                    "foreignField": "author",
                    "as": "user_posts"
                }
            },
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "_id": 0,
                    "name": 1,
                    "followers": "$followers_count",
                    "posts": {"$size": "$user_posts"}
                }
            },
            {"$sort": {"followers": -1, "posts": -1}}
        ]
        try:
            results = list(cls.objects.aggregate(pipeline))
            return results
        except Exception as e:
            print(f"Error Agregación Talento: {e}")
            return []

    meta = {
        'indexes': ['birth_date', 'sport']
    }

class Comment(EmbeddedDocument):
    id = StringField(default=lambda: str(ObjectId()))
    author = ReferenceField('User', required=True)
    text = StringField(required=True)
    media_url = StringField()
    is_edited = BooleanField(default=False)
    timestamp = DateTimeField(default=datetime.utcnow)

class Post(Document):
    author = ReferenceField('User', required=True)
    content = StringField(required=True)
    media_url = StringField()
    is_edited = BooleanField(default=False)
    is_repost = BooleanField(default=False)
    original_post = ReferenceField('Post', reverse_delete_rule=1) 
    likes = ListField(ReferenceField('User'))
    comments = ListField(EmbeddedDocumentField(Comment))
    
    # Profile Share Fields
    shared_profile = ReferenceField('User', reverse_delete_rule=1)

    # Marketplace Fields
    post_type = StringField(default='post') # post, service, profile_share
    service_title = StringField()
    service_price = FloatField()
    average_rating = FloatField(default=0.0)
    ratings_count = IntField(default=0)
    
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': ['author', 'timestamp']
    }

class Message(Document):
    sender = ReferenceField('User', required=True)
    receiver = ReferenceField('User', required=True)
    body = StringField(required=True)
    media_url = StringField()
    is_edited = BooleanField(default=False)
    unread_by = ListField(ReferenceField('User'), default=list)
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'strict': False,
        'indexes': [
            ['sender', 'receiver'],
            ['receiver', 'unread_by']
        ]
    }

class Rating(Document):
    user = ReferenceField('User', required=True)
    post = ReferenceField('Post', required=True)
    score = IntField(min_value=1, max_value=5, required=True)
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['user', 'post'], 'unique': True}
        ]
    }

class Notification(Document):
    CHOICES = ('like', 'follow', 'comment', 'repost')
    
    actor = ReferenceField('User', required=True)
    recipient = ReferenceField('User', required=True)
    action_type = StringField(choices=CHOICES, required=True)
    post_id = ReferenceField('Post')  # Opcional, solo para like/comment/repost
    read = BooleanField(default=False)
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': ['recipient', '-timestamp']
    }

class AnalyticsEvent(Document):
    visited_profile_id = ReferenceField('User', required=True)
    visitor_age = IntField(required=True)
    visitor_role = StringField(default='athlete')
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': ['visited_profile_id', 'timestamp']
    }

    @classmethod
    def register_visit(cls, visited_id, visitor_age, visitor_role='athlete'):
        event = cls(visited_profile_id=visited_id, visitor_age=visitor_age, visitor_role=visitor_role)
        event.save()
        return event

    @classmethod
    def get_role_distribution(cls, profile_id=None):
        """
        Calcula cuántas visitas provienen de cada rol (Atleta vs Reclutador).
        Los datos se extraen de la colección 'analytics_event' de MongoDB.
        """
        pipeline = []
        # Filtro opcional: Si hay un ID de perfil, filtramos solo las visitas a ese usuario específico
        if profile_id:
            if isinstance(profile_id, str):
                profile_id = ObjectId(profile_id)
            pipeline.append({"$match": {"visited_profile_id": profile_id}})
            
        # Agrupación: Clasificamos por el campo 'visitor_role' y sumamos las ocurrencias
        pipeline.append({"$group": {
            "_id": "$visitor_role",
            "count": {"$sum": 1}
        }})
        
        try:
            results = list(cls.objects.aggregate(pipeline))
            
            athlete_count = 0
            recruiter_count = 0
            unknown_count = 0
            
            for r in results:
                role = r["_id"]
                count = r["count"]
                if role == 'athlete':
                    athlete_count += count
                elif role in ['recruiter', 'scout']:
                    recruiter_count += count
                else:
                    # Incluye roles None, vacíos o no mapeados (datos antiguos)
                    unknown_count += count
            
            # Repartir 50/50 según lo solicitado por el usuario
            if unknown_count > 0:
                athlete_count += unknown_count // 2
                recruiter_count += unknown_count - (unknown_count // 2)
            
            final_distribution = []
            if athlete_count > 0 or recruiter_count > 0:
                final_distribution = [
                    {"name": "athlete", "value": athlete_count},
                    {"name": "recruiter", "value": recruiter_count}
                ]
            else:
                # Si no hay nada de nada
                final_distribution = []
                
            return final_distribution
        except Exception:
            return []

    @classmethod
    def get_visitor_age_stats(cls, profile_id=None):
        """
        Calcula estadísticas descriptivas (Media, Mínimo y Máximo) de edad de los visitantes.
        Utiliza el motor de agregación de MongoDB para procesar los datos directamente en el servidor de base de datos.
        """
        pipeline = []
        if profile_id:
            if isinstance(profile_id, str):
                profile_id = ObjectId(profile_id)
            pipeline.append({"$match": {"visited_profile_id": profile_id}})
            
        # Cálculo Estadístico: Extraemos la media ($avg), el mínimo ($min) y el máximo ($max) en una sola pasada.
        pipeline.append({"$group": {
            "_id": "$visited_profile_id" if profile_id else None,
            "average_age": {"$avg": "$visitor_age"},
            "min_age": {"$min": "$visitor_age"},
            "max_age": {"$max": "$visitor_age"},
            "total_visits": {"$sum": 1}
        }})
        
        try:
            result = list(cls.objects.aggregate(pipeline))
            return result[0] if result else None
        except Exception:
            return None

    @classmethod
    def get_demographic_percentages(cls, profile_id=None):
        """
        Genera una distribución de frecuencias por rangos de edad (Histograma).
        Los datos provienen de AnalyticsEvent y se segmentan en 'cubetas' o buckets.
        """
        pipeline = []
        if profile_id:
            if isinstance(profile_id, str):
                profile_id = ObjectId(profile_id)
            pipeline.append({"$match": {"visited_profile_id": profile_id}})
            
        # Bucket: Agrupamos las edades en intervalos predefinidos para la visualización de barras en el frontend.
        pipeline.append({"$bucket": {
            "groupBy": "$visitor_age",
            "boundaries": [0, 18, 25, 35, 45, 60, 100],
            "default": "Unknown",
            "output": {
                "count": {"$sum": 1}
            }
        }})
        
        results = list(cls.objects.aggregate(pipeline))
        total_visits = cls.objects(visited_profile_id=profile_id).count() if profile_id else cls.objects.count()
        
        percentages = []
        for r in results:
            percentages.append({
                "age_group_start": r["_id"],
                "percentage": round((r["count"] / total_visits) * 100, 2) if total_visits > 0 else 0,
                "count": r["count"]
            })
            
        return percentages
