from core.models import User
import time

user1 = User.objects.first()
user2 = User.objects.skip(1).first()

print(f"User1 ({user1.name}) follows {len(user1.following)} people")
print(f"User1 is following User2? {user2 in user1.following}")

# Try to follow
print("Trying to add...")
User.objects(id=user1.id).update_one(add_to_set__following=user2)
user1.reload()
print(f"User1 follows {len(user1.following)} people")

# Try to pull
print("Trying to pull...")
User.objects(id=user1.id).update_one(pull__following=user2)
user1.reload()
print(f"User1 follows {len(user1.following)} people")
