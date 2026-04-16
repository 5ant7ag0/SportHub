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
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    is_following = serializers.SerializerMethodField()

    def get_followers_count(self, obj):
        return len(obj.followers) if getattr(obj, 'followers', None) else 0
        
    def get_following_count(self, obj):
        return len(obj.following) if getattr(obj, 'following', None) else 0

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user:
            return obj in getattr(request.user, 'following', [])
        return False

    def get_posts_count(self, obj):
        try:
            from core.models import Post
            return Post.objects(author=obj, post_type='post').count()
        except: return 0

    def get_services_count(self, obj):
        try:
            from core.models import Post
            return Post.objects(author=obj, post_type='service').count()
        except: return 0

class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    author = UserSerializer(read_only=True)
    text = serializers.CharField()
    media_url = serializers.CharField(required=False, allow_null=True)
    is_edited = serializers.BooleanField(required=False)
    timestamp = serializers.DateTimeField()

class PostSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    author = UserSerializer(read_only=True)
    content = serializers.CharField()
    media_url = serializers.CharField(required=False, allow_null=True)
    is_edited = serializers.BooleanField(required=False)
    is_repost = serializers.BooleanField(required=False)
    original_post = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()
    is_saved_by_user = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    post_type = serializers.CharField(required=False)
    service_title = serializers.CharField(required=False, allow_null=True)
    service_price = serializers.FloatField(required=False, allow_null=True)
    average_rating = serializers.FloatField(read_only=True)
    ratings_count = serializers.IntegerField(read_only=True)
    user_has_rated = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField()

    def get_original_post(self, obj):
        if obj.is_repost and obj.original_post:
            return {
                "id": str(obj.original_post.id),
                "author": UserSerializer(obj.original_post.author).data,
                "content": obj.original_post.content,
                "media_url": obj.original_post.media_url,
                "timestamp": obj.original_post.timestamp
            }
        return None

    def get_likes_count(self, obj):
        return len(obj.likes) if getattr(obj, 'likes', None) else 0

    def get_shares_count(self, obj):
        try: return Post.objects(original_post=obj, is_repost=True).count()
        except: return 0

    def get_is_liked_by_user(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user:
                return request.user in getattr(obj, 'likes', [])
            return False
        except: return False
        
    def get_is_saved_by_user(self, obj):
        try:
            request = self.context.get('request')
            if request and hasattr(request, 'user') and request.user:
                return obj in getattr(request.user, 'saved_posts', [])
            return False
        except: return False
        
    def get_comments(self, obj):
        try:
            if self.context.get('full_comments', False):
                return CommentSerializer(obj.comments or [], many=True).data
            recent_comments = obj.comments[-3:] if obj.comments else []
            return CommentSerializer(recent_comments, many=True).data
        except: return []

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
