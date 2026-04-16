import json
import jwt
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from .models import User
from datetime import datetime
from asgiref.sync import sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Extraer el token de la URL
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            await self.close()
            return

        try:
            # 2. Validar identidad con el SECRET_KEY de Django
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')
            
            if not user_id:
                await self.close()
                return

            self.user_id = str(user_id)
            self.user_group_name = f'user_{self.user_id}'
            self.presence_group_name = 'presence'

            # 3. Unirse a los grupos (Privado y Global)
            await self.channel_layer.group_add(self.user_group_name, self.channel_name)
            await self.channel_layer.group_add(self.presence_group_name, self.channel_name)

            # 4. Aceptar la conexión
            await self.accept()

            # 5. Notificar a todos que entraste (y actualizar MongoDB)
            await self.update_last_activity(self.user_id)
            await self.broadcast_presence(True)

        except Exception as e:
            print(f"❌ WebSocket Auth Error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        # 1. Notificar desconexión ANTES de descartar los grupos
        if hasattr(self, 'user_id'):
            try:
                await self.broadcast_presence(False)
            except Exception as e:
                print(f"⚠️ Error notificando salida: {e}")

        # 2. Salir de los grupos para limpiar memoria
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        
        if hasattr(self, 'presence_group_name'):
            await self.channel_layer.group_discard(self.presence_group_name, self.channel_name)

    async def broadcast_presence(self, is_online):
        """Envía un grito al grupo 'presence' para que todos actualicen sus donuts"""
        if hasattr(self, 'user_id'):
            await self.channel_layer.group_send(
                'presence',
                {
                    'type': 'presence_update',
                    'data': {
                        'user_id': self.user_id,
                        'is_online': is_online
                    }
                }
            )

    async def presence_update(self, event):
        """Este método recibe el grito del grupo y lo pasa al navegador del usuario"""
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'data': event['data']
        }))

    async def new_notification(self, event):
        """Maneja alertas de mensajes, likes, posts, etc."""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'data': event.get('data', {})
        }))

    @sync_to_async
    def update_last_activity(self, user_id):
        """Actualización rápida en MongoDB Atlas"""
        try:
            # Usamos update_one para mayor velocidad en el pulso de conexión
            User.objects(id=user_id).update_one(set__last_activity=datetime.utcnow())
        except Exception as e:
            print(f"💾 Error Mongo (Activity): {e}")