import os
import django
import json

# Preparar entorno de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from django.test import Client

def run_test():
    client = Client()
    print("Realizando petición GET a /api/analytics/summary/ ...\n")
    
    response = client.get('/api/analytics/summary/')
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\nJSON devuelto por el API (Validado por DRF):\n")
        print(json.dumps(data, indent=4, ensure_ascii=False))
    else:
        print(f"\nError en la respuesta (Status {response.status_code})")
        print(response.json())

if __name__ == '__main__':
    run_test()
