# sms/consumers.py - Consumer WebSocket corrigé SANS émojis

import json
import logging
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone  # ✅ Import manquant ajouté

logger = logging.getLogger(__name__)
User = get_user_model()

class SMSConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket pour les notifications SMS temps réel"""
    
    async def connect(self):
        """Connexion WebSocket avec authentification JWT"""
        try:
            # Récupérer le token depuis les query params
            query_string = self.scope['query_string'].decode()
            token = None
            
            # Parser les query params
            if 'token=' in query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('token=')[1]
                        break
            
            if not token:
                logger.warning("Token manquant dans la connexion WebSocket")  # ✅ Émoji supprimé
                await self.close(code=4001)  # Code d'erreur personnalisé
                return
            
            # Valider le token JWT
            try:
                user = await self.get_user_from_token(token)
                
                if user and user.is_authenticated:
                    self.user = user
                    self.user_group_name = f"user_{user.id}"
                    
                    # Rejoindre le groupe de l'utilisateur
                    await self.channel_layer.group_add(
                        self.user_group_name,
                        self.channel_name
                    )
                    
                    await self.accept()
                    logger.info(f"WebSocket connecte pour utilisateur {user.username} (ID: {user.id})")  # ✅ Émoji supprimé
                    
                    # Envoyer confirmation de connexion
                    await self.send(text_data=json.dumps({
                        'type': 'connection_established',
                        'message': 'Connexion WebSocket etablie avec succes',
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'nom': user.nom,
                            'prenom': user.prenom
                        },
                        'timestamp': str(timezone.now())
                    }))
                    
                else:
                    logger.warning("Utilisateur non authentifie")  # ✅ Émoji supprimé
                    await self.close(code=4003)  # Non autorisé
                    
            except Exception as e:
                logger.warning(f"Token invalide: {e}")  # ✅ Émoji supprimé
                await self.close(code=4002)  # Token invalide
                
        except Exception as e:
            logger.error(f"Erreur connexion WebSocket: {e}")  # ✅ Émoji supprimé
            await self.close(code=4000)  # Erreur générale
    
    async def disconnect(self, close_code):
        """Déconnexion WebSocket"""
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"WebSocket deconnecte pour {getattr(self, 'user', 'unknown')} (Code: {close_code})")  # ✅ Émoji supprimé
    
    async def receive(self, text_data):
        """Réception de messages depuis le client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.debug(f"Message recu du client: {message_type}")  # ✅ Émoji supprimé
            
            if message_type == 'ping':
                # Répondre au ping pour maintenir la connexion
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp'),
                    'server_time': str(timezone.now())
                }))
                
            elif message_type == 'mark_as_read':
                # Marquer un message comme lu
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    updated_count = await self.mark_conversation_as_read(conversation_id)
                    
                    # Confirmer au client
                    await self.send(text_data=json.dumps({
                        'type': 'mark_as_read_response',
                        'conversation_id': conversation_id,
                        'updated_count': updated_count,
                        'success': True
                    }))
                    
            elif message_type == 'get_status':
                # Retourner le statut de la connexion
                await self.send(text_data=json.dumps({
                    'type': 'status_response',
                    'connected': True,
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'group': self.user_group_name
                }))
                
            else:
                logger.warning(f"Type de message non gere: {message_type}")  # ✅ Émoji supprimé
                
        except json.JSONDecodeError:
            logger.warning("Format JSON invalide recu")  # ✅ Émoji supprimé
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format JSON invalide'
            }))
        except Exception as e:
            logger.error(f"Erreur traitement message WebSocket: {e}")  # ✅ Émoji supprimé
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Erreur traitement du message'
            }))
    
    async def send_notification(self, event):
        """Envoyer une notification au client - Méthode appelée par le channel layer"""
        try:
            notification = event['notification']
            
            # Envoyer la notification au client WebSocket
            await self.send(text_data=json.dumps(notification))
            
            logger.debug(f"Notification envoyee: {notification.get('type')}")  # ✅ Émoji supprimé
            
        except Exception as e:
            logger.error(f"Erreur envoi notification: {e}")  # ✅ Émoji supprimé
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Récupérer l'utilisateur depuis le token JWT"""
        try:
            # Décoder le token pour récupérer l'user_id
            decoded_token = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )
            user_id = decoded_token.get('user_id')
            
            if user_id:
                return User.objects.get(id=user_id, is_active=True)
            return None
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expire")  # ✅ Émoji supprimé
            return None
        except jwt.InvalidTokenError:
            logger.warning("Token invalide")  # ✅ Émoji supprimé
            return None
        except User.DoesNotExist:
            logger.warning(f"Utilisateur {user_id} non trouve")  # ✅ Émoji supprimé
            return None
        except Exception as e:
            logger.error(f"Erreur decodage token: {e}")
            return None
    
    @database_sync_to_async
    def mark_conversation_as_read(self, conversation_id):
        """Marquer une conversation comme lue"""
        try:
            from .models import Conversation
            
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=self.user
            )
            
            # Marquer tous les messages non lus comme lus
            updated_count = conversation.messages.filter(
                recipient_phone=self.user.telephone,
                is_read=False
            ).update(is_read=True)
            
            logger.info(f"{updated_count} messages marques comme lus pour conversation {conversation_id}")  # ✅ Émoji supprimé
            return updated_count
            
        except Exception as e:
            logger.error(f"Erreur mark as read: {e}")  # ✅ Émoji supprimé
            return 0