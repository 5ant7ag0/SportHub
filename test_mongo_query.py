
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User
from bson import ObjectId

def test_query_behavior():
    luis = User.objects.get(email='luis@gmail.com')
    brayan = User.objects.get(email='brayant@gmail.com')
    
    # 1. ¿Está Brayan en la lista 'following' de Luis? (Lógica Python)
    print(f"Brayan in luis.following (Python): {brayan in luis.following}")
    
    # 2. ¿Funciona la query de MongoDB que usamos en el serializer?
    res = User.objects(id=luis.id, following=brayan.id).count()
    print(f"User.objects(id=luis, following=brayan).count(): {res}")
    
    # 3. ¿Y si usamos el objeto completo?
    res_obj = User.objects(id=luis.id, following=brayan).count()
    print(f"User.objects(id=luis, following=brayan_obj).count(): {res_obj}")

    # 4. Inspección de tipos en MongoDB
    from pymongo import MongoClient
    client = MongoClient('mongodb://localhost:27017/')
    db = client['sporthub']
    luis_raw = db['user'].find_one({'_id': luis.id})
    print(f"Tipo del primer elemento en 'following' (Raw MongoDB): {type(luis_raw['following'][0])}")
    print(f"Valor del primer elemento: {luis_raw['following'][0]}")

if __name__ == "__main__":
    test_query_behavior()
