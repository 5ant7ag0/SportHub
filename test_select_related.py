from core.models import Post
try:
    Post.objects().select_related()
    print("select_related works!")
except Exception as e:
    print(e)
