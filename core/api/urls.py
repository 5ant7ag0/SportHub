from django.urls import path
from .views import AnalyticsView, FollowView, LikeView, SendMessageView, InboxView, ConversationDetailView, FeedView, PostDetailView, PostLikesListView, ProfileView, CommentView, SearchView, NetworkSuggestionsView, SavePostView, SavedPostsListView, ConnectionRequestView, AcceptConnectionView, EditMessageView, EditPostView, PendingConnectionsView, ConnectionsListView, UnreadCountView, NotificationListView, NotificationCountView, ClearChatView, DeleteChatView, MarkAsUnreadView, RatePostView, AdminUserManagementView, UserFollowersListView, UserFollowingListView
from .auth_views import CustomTokenObtainPairView, CustomTokenRefreshView, RegisterView
from .upload_views import PostCreateView, MessageWithMediaView, CommentWithMediaView, PostShareView
from .profile_views import ProfileUpdateView, AccountDeleteView

urlpatterns = [
    # Analítica
    path('analytics/summary/', AnalyticsView.as_view(), name='analytics-summary'),
    path('admin/users/', AdminUserManagementView.as_view(), name='admin-users'),
    
    # Interacción Social
    path('social/follow/', FollowView.as_view(), name='follow'),
    path('social/followers/', UserFollowersListView.as_view(), name='user-followers'),
    path('social/following/', UserFollowingListView.as_view(), name='user-following'),
    path('social/like/', LikeView.as_view(), name='like'),
    path('social/notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('social/notifications/count/', NotificationCountView.as_view(), name='notifications-count'),
    
    # Mensajería
    path('messages/send/', MessageWithMediaView.as_view(), name='send-message'),
    path('messages/edit/<str:message_id>/', EditMessageView.as_view(), name='edit-message'),
    path('messages/inbox/', InboxView.as_view(), name='inbox'),
    path('messages/conversation/<str:contact_id>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('messages/unread-count/', UnreadCountView.as_view(), name='unread-count'),
    path('messages/clear/<str:contact_id>/', ClearChatView.as_view(), name='clear-chat'),
    path('messages/delete/<str:contact_id>/', DeleteChatView.as_view(), name='delete-chat'),
    path('messages/mark-unread/<str:contact_id>/', MarkAsUnreadView.as_view(), name='mark-unread'),
    
    # Auth y Media
    path('auth/token/obtain/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login_alias'),
    path('register/', RegisterView.as_view(), name='register'),
    path('posts/create/', PostCreateView.as_view(), name='posts-create'),
    path('posts/share/', PostShareView.as_view(), name='posts-share'),
    path('posts/comment/', CommentWithMediaView.as_view(), name='posts-comment'),
    path('posts/edit/<str:post_id>/', EditPostView.as_view(), name='posts-edit'),
    path('posts/rate/<str:post_id>/', RatePostView.as_view(), name='posts-rate'),
    
    # Nuevas Rutas de Interfaz Principal
    path('feed/', FeedView.as_view(), name='feed'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('settings/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('settings/delete-account/', AccountDeleteView.as_view(), name='delete-account'),
    
    # Funciones Avanzadas 2.0
    path('search/', SearchView.as_view(), name='search'),
    path('network/suggestions/', NetworkSuggestionsView.as_view(), name='network-suggestions'),
    path('network/request/', ConnectionRequestView.as_view(), name='network-request'),
    path('network/accept/', AcceptConnectionView.as_view(), name='network-accept'),
    path('network/pending/', PendingConnectionsView.as_view(), name='network-pending'),
    path('network/connections/', ConnectionsListView.as_view(), name='network-connections'),
    path('posts/save/', SavePostView.as_view(), name='posts-save'),
    path('posts/saved/', SavedPostsListView.as_view(), name='posts-saved-list'),
    path('posts/<str:post_id>/', PostDetailView.as_view(), name='posts-detail'),
    path('posts/<str:post_id>/likes/', PostLikesListView.as_view(), name='posts-likes'),
]
