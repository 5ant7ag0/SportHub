
import os
import django
from mongoengine import connect

# Setup Django (if needed, but we use mongoengine directly)
import sys
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')

# Connect to MongoDB
from core.models import User
connect('sporthub') # Assuming the DB name is sporthub

carlos = User.objects(email='carlos@gmail.com').first()
if carlos:
    print(f"User: {carlos.email}, Role: {carlos.role}")
else:
    print("User carlos@gmail.com not found")

brayant = User.objects(email='brayant@gmail.com').first()
if brayant:
    print(f"User: {brayant.email}, Role: {brayant.role}")
else:
    print("User brayant@gmail.com not found")
