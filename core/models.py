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
    followers = ListField(ReferenceField('self'))
    following = ListField(ReferenceField('self'))
    pending_connections = ListField(ReferenceField('self'))
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
            "online": res["online"][0]["count"] if res["online"] else 0,
            "offline": res["offline"][0]["count"] if res["offline"] else 0
        }

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
    
    # Marketplace Fields
    post_type = StringField(default='post') # post, service
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
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': ['visited_profile_id', 'timestamp']
    }

    @classmethod
    def register_visit(cls, visited_id, visitor_age):
        event = cls(visited_profile_id=visited_id, visitor_age=visitor_age)
        event.save()
        return event

    @classmethod
    def get_visitor_age_stats(cls, profile_id=None):
        """
        Calcula estadísticas descriptivas (Media, Min, Max) a nivel de clúster
        usando Aggregation Pipelines. Si profile_id es None, calcula globales.
        """
        pipeline = []
        if profile_id:
            if isinstance(profile_id, str):
                profile_id = ObjectId(profile_id)
            pipeline.append({"$match": {"visited_profile_id": profile_id}})
            
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
        Agrupa visitantes por rangos de edad e identifica porcentajes demográficos.
        Si profile_id es None, calcula globales.
        """
        pipeline = []
        if profile_id:
            if isinstance(profile_id, str):
                profile_id = ObjectId(profile_id)
            pipeline.append({"$match": {"visited_profile_id": profile_id}})
            
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
