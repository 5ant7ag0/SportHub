# Se encarga de serializar los datos
# Serializer: Convierte objetos de Python a JSON

from rest_framework import serializers
from core.models import Post, User

class DemographicPercentageSerializer(serializers.Serializer):
    age_group_start = serializers.IntegerField()
    percentage = serializers.FloatField()
    count = serializers.IntegerField()

class AnalyticsSerializer(serializers.Serializer):
    total_visits = serializers.IntegerField()
    average_age = serializers.FloatField(required=False, allow_null=True)
    total_likes = serializers.IntegerField(required=False)
    total_comments = serializers.IntegerField(required=False)
    demographics = DemographicPercentageSerializer(many=True)
    extra_stats = serializers.DictField(required=False, allow_null=True)
    stats_por_deporte = serializers.ListField(child=serializers.DictField(), required=False)
    is_global = serializers.BooleanField(required=False)
    trends = serializers.ListField(child=serializers.DictField(), required=False)
    user_growth = serializers.ListField(child=serializers.DictField(), required=False)
    city_ranking = serializers.ListField(child=serializers.DictField(), required=False)
    connection_status = serializers.DictField(required=False)
    community_pulse = serializers.ListField(child=serializers.DictField(), required=False)
    talent_growth = serializers.ListField(child=serializers.DictField(), required=False)
    roles_distribution = serializers.ListField(child=serializers.DictField(), required=False)
    visits_today = serializers.IntegerField(required=False)

class MessageSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    sender_id = serializers.SerializerMethodField()
    receiver_id = serializers.SerializerMethodField()
    body = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    media_url = serializers.CharField(required=False, allow_null=True)
    is_edited = serializers.BooleanField(required=False)
    read = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(required=False)

    def get_sender_id(self, obj):
        try: return str(obj.sender.id) if obj.sender else ""
        except: return ""

    def get_receiver_id(self, obj):
        try: return str(obj.receiver.id) if obj.receiver else ""
        except: return ""

    def get_read(self, obj):
        try:
            request = self.context.get('request')
            if request and request.user:
                unread = getattr(obj, 'unread_by', []) or []
                unread_ids = [str(u.id) if hasattr(u, 'id') else str(u) for u in unread]
                return str(request.user.id) not in unread_ids
            return True
        except: return True

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    email = serializers.EmailField()
    birth_date = serializers.DateTimeField(required=False, allow_null=True)
    computed_age = serializers.IntegerField(required=False, allow_null=True, read_only=True)
    sport = serializers.CharField(required=False, allow_null=True)
    position = serializers.CharField(required=False, allow_null=True)
    city = serializers.CharField(required=False, allow_null=True)
    avatar_url = serializers.CharField(required=False, allow_null=True)
    banner_url = serializers.CharField(required=False, allow_null=True)
    bio = serializers.CharField(required=False, allow_null=True)
    role = serializers.CharField(required=False, allow_null=True)
    company = serializers.CharField(required=False, allow_null=True)
    job_title = serializers.CharField(required=False, allow_null=True)
    skills = serializers.DictField(required=False, allow_null=True)
    achievements = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    social_links = serializers.DictField(required=False, allow_null=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_private = serializers.BooleanField(required=False, default=False)
    is_active = serializers.BooleanField(required=False, default=True)
    is_suspended = serializers.BooleanField(required=False, default=False)
    notifications_enabled = serializers.BooleanField(required=False, default=True)
    is_online = serializers.BooleanField(read_only=True)
    posts_count = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    total_likes = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    is_following = serializers.SerializerMethodField()

    def get_followers_count(self, obj):
        return len(obj.followers) if getattr(obj, 'followers', None) else 0
        
    def get_following_count(self, obj):
        return len(obj.following) if getattr(obj, 'following', None) else 0

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        auth_user = getattr(request, 'user', None)
        if not auth_user:
            return False
        try:
            from bson import ObjectId
            from core.models import User
            
            auth_id = ObjectId(str(auth_user.id))
            target_id = ObjectId(str(obj.id))
            
            # Consulta directa de conteo para evitar cualquier caché de campo
            return User.objects(id=auth_id, following=target_id).count() > 0
        except Exception:
            return False

    def get_posts_count(self, obj):
        if self.context.get('exclude_analytics'): return 0
        try:
            from core.models import Post
            return Post.objects(author=obj, post_type='post').count()
        except: return 0

    def get_total_likes(self, obj):
        if self.context.get('exclude_analytics'): return 0
        try:
            from core.models import Post
            posts = Post.objects(author=obj)
            return sum(len(post.likes) for post in posts if post.likes)
        except: return 0

    def get_average_rating(self, obj):
        if self.context.get('exclude_analytics'): return 0.0
        try:
            from core.models import Post
            services = Post.objects(author=obj, post_type='service', ratings_count__gt=0)
            if not services:
                return 0.0
            
            total_score = sum(s.average_rating * s.ratings_count for s in services)
            total_ratings = sum(s.ratings_count for s in services)
            
            return round(total_score / total_ratings, 1) if total_ratings > 0 else 0.0
        except: return 0.0

    def get_services_count(self, obj):
        if self.context.get('exclude_analytics'): return 0
        try:
            from core.models import Post
            return Post.objects(author=obj, post_type='service').count()
        except: return 0

class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    author = serializers.SerializerMethodField()
    text = serializers.CharField()
    media_url = serializers.CharField(required=False, allow_null=True)
    is_edited = serializers.BooleanField(required=False)
    timestamp = serializers.DateTimeField()

    def get_author(self, obj):
        ctx = dict(self.context)
        ctx['exclude_analytics'] = True
        return UserSerializer(obj.author, context=ctx).data

class PostSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    author = serializers.SerializerMethodField()
    content = serializers.CharField()
    media_url = serializers.CharField(required=False, allow_null=True)

    def get_author(self, obj):
        ctx = dict(self.context)
        ctx['exclude_analytics'] = True
        return UserSerializer(obj.author, context=ctx).data
    is_edited = serializers.BooleanField(required=False)
    is_repost = serializers.BooleanField(required=False)
    original_post = serializers.SerializerMethodField()
    shared_profile = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()
    is_saved_by_user = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    post_type = serializers.CharField(required=False)
    service_title = serializers.CharField(required=False, allow_null=True)
    service_price = serializers.FloatField(required=False, allow_null=True)
    average_rating = serializers.FloatField(read_only=True)
    ratings_count = serializers.IntegerField(read_only=True)
    user_has_rated = serializers.SerializerMethodField()
    sport = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField()
    def get_original_post(self, obj):
        if obj.is_repost and obj.original_post:
            ctx = dict(self.context)
            ctx['exclude_analytics'] = True
            return {
                "id": str(obj.original_post.id),
                "author": UserSerializer(obj.original_post.author, context=ctx).data,
                "content": obj.original_post.content,
                "media_url": obj.original_post.media_url,
                "timestamp": obj.original_post.timestamp.isoformat() + "Z" if obj.original_post.timestamp else None,
                "sport": getattr(obj.original_post.author, 'sport', None)
            }
        return None

    def get_shared_profile(self, obj):
        if getattr(obj, 'post_type', 'post') == 'profile_share' and getattr(obj, 'shared_profile', None):
            ctx = dict(self.context)
            ctx['exclude_analytics'] = True
            return UserSerializer(obj.shared_profile, context=ctx).data
        return None

    def get_sport(self, obj):
        return getattr(obj.author, 'sport', None)

    def get_likes_count(self, obj):
        return len(obj.likes) if getattr(obj, 'likes', None) else 0

    def get_shares_count(self, obj):
        try:
            return Post.objects(original_post=obj.id, is_repost=True).count()
        except: return 0

    def get_is_liked_by_user(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user:
                return str(request.user.id) in [str(getattr(like, 'id', like)) for like in obj._data.get('likes', [])]
            return False
        except: return False
        
    def get_is_saved_by_user(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user:
                return str(obj.id) in [str(getattr(saved, 'id', saved)) for saved in request.user._data.get('saved_posts', [])]
            return False
        except: return False
        
    def get_comments(self, obj):
        try:
            return CommentSerializer(obj.comments or [], many=True).data
        except: return []

    def get_comments_count(self, obj):
        try:
            return len(obj.comments) if getattr(obj, 'comments', None) else 0
        except: return 0

    def get_user_has_rated(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
                from core.models import Rating
                return Rating.objects(user=request.user, post=obj).count() > 0
            return False
        except: return False

class NotificationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    actor = UserSerializer(read_only=True)
    action_type = serializers.CharField()
    post_id = serializers.SerializerMethodField()
    read = serializers.BooleanField()
    timestamp = serializers.DateTimeField()

    def get_post_id(self, obj):
        try:
            if hasattr(obj, 'post_id') and obj.post_id:
                return str(obj.post_id.id)
        except: return None
        return None
