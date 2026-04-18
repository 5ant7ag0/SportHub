import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User

user1 = User.objects.first()
user2 = User.objects.skip(1).first()

print("User1 DB following length:", len(user1.following))
is_following_obj = User.objects(id=user1.id, following=user2).count() > 0
is_following_id = User.objects(id=user1.id, following=user2.id).count() > 0

print("is_following using obj:", is_following_obj)
print("is_following using target_user.id:", is_following_id)

User.objects(id=user1.id).update_one(add_to_set__following=user2)
user1.reload()
print("After add_to_set__following=user2, following:", len(user1.following))
is_following_id_after = User.objects(id=user1.id, following=user2.id).count() > 0
print("is_following using target_user.id AFTER add:", is_following_id_after)
User.objects(id=user1.id).update_one(pull__following=user2)

