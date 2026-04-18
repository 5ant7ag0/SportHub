import time
from core.models import User
from core.api.views import ProfileView, AnalyticsSummaryView
from rest_framework.test import APIRequestFactory

user = User.objects.first()
factory = APIRequestFactory()

t0 = time.time()
request = factory.get(f'/profile/?id={user.id}')
request.user = user
view = ProfileView.as_view()
response = view(request)
t1 = time.time()

print("ProfileView TIME:", t1-t0)

t0 = time.time()
request = factory.get(f'/analytics/summary/?profile_id={user.id}')
request.user = user
view = AnalyticsSummaryView.as_view()
response = view(request)
t1 = time.time()

print("AnalyticsView TIME:", t1-t0)
