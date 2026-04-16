from mongoengine import connect
import sys

# Conectar a la base de datos
try:
    connect('sporthub_db', host='mongodb://localhost:27017/sporthub_db')
    from core.models import User
    
    u = User.objects(email='brayant@gmail.com').first()
    if u:
        u.role = 'admin'
        u.save()
        print(f'SUCCESS: User {u.email} is now {u.role}')
    else:
        print('ERROR: User not found')
except Exception as e:
    print(f'FATAL ERROR: {str(e)}')
