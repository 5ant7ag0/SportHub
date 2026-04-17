import os
import django
from datetime import datetime, timedelta
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import Notification, Message

def diagnose():
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    pipeline = [
        {"$match": {
            "timestamp": {"$gte": start_date},
            "action_type": {"$in": ["like", "comment", "repost"]}
        }},
        {"$project": {
            "day": {"$isoDayOfWeek": "$timestamp"},
            "hour": {"$hour": "$timestamp"}
        }},
        {"$group": {
            "_id": {"day": "$day", "hour": "$hour"},
            "count": {"sum": 1} # ERROR INTENCIONAL: debería ser "$sum": 1
        }}
    ]

    # ESPERA! Acabo de ver un posible error en mi pipeline mental. 
    # Es "$sum": 1, no "sum": 1. Pero en views.py puse "$sum": 1?
    # Vamos a verificar views.py
    
    print(f"Buscando desde: {start_date} hasta {end_date}")
    
    total_notifs = Notification.objects(timestamp__gte=start_date).count()
    print(f"Total notificaciones en el rango: {total_notifs}")
    
    # Probar agregación de notificaciones
    p2 = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$action_type", "count": {"$sum": 1}}}
    ]
    res2 = list(Notification._get_collection().aggregate(p2))
    print(f"Distribución por tipo: {res2}")
    
    # Probar la agregación real
    p3 = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$project": {
            "day": {"$isoDayOfWeek": "$timestamp"},
            "hour": {"$hour": "$timestamp"}
        }},
        {"$group": {
            "_id": {"day": "$day", "hour": "$hour"},
            "count": {"$sum": 1}
        }}
    ]
    res3 = list(Notification._get_collection().aggregate(p3))
    print(f"Resultado Heatmap Notif: {res3}")

if __name__ == "__main__":
    diagnose()
