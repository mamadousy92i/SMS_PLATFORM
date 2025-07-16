# account/services.py - Version corrigée pour Orange SMS

import requests
import os
import logging
import urllib.parse
import base64
from datetime import timedelta
from django.utils import timezone
from .models import OAuthToken
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from dotenv import load_dotenv

load_dotenv()


logger = logging.getLogger(__name__)

class OrangeOAuth:
    CLIENT_ID = os.getenv('ORANGE_CLIENT_ID', 'c6HwTEwXwa4z4w3PD6bDrvG3FICjvHLo')
    CLIENT_SECRET = os.getenv('ORANGE_CLIENT_SECRET', '0rLdTGf3aNhkTBPgrnVhB9RfI9s9qyX2HRjtj6raTzrV')
    
    # ✅ Configuration selon votre compte Orange
    DEFAULT_SENDER_NAME = os.getenv('ORANGE_SENDER_NAME', 'ESMT')  # ✅ Depuis .env
    API_SENDER_PHONE = "+221777567226"  # Votre numéro avec forfait
    COUNTRY_CODE = "221"  # Code pays Sénégal
    
    SMS_BASE_URL_HTTPS = "https://api.orange.com"
    OAUTH_URL = "https://api.orange.com/oauth/v3/token"

    @staticmethod
    def get_access_token():
        """Obtient un token OAuth valide"""
        try:
            token = OAuthToken.get_valid_token()
            if token:
                logger.info("Token existant valide trouvé")
                return token.access_token
        except Exception as e:
            logger.warning(f"Pas de token valide en cache: {e}")

        logger.info("Génération d'un nouveau token OAuth")
        return OrangeOAuth.force_new_token()

    @staticmethod
    def force_new_token():
        """Force la génération d'un nouveau token"""
        try:
            # Supprimer anciens tokens
            OAuthToken.objects.all().delete()
            
            # Générer Basic Auth header
            auth_string = base64.b64encode(
                f"{OrangeOAuth.CLIENT_ID}:{OrangeOAuth.CLIENT_SECRET}".encode()
            ).decode()
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': f'Basic {auth_string}',
                'User-Agent': 'Orange-SMS-Django/1.0'
            }
            
            data = {"grant_type": "client_credentials"}
            
            logger.info(f"Requête OAuth vers: {OrangeOAuth.OAUTH_URL}")
            
            response = requests.post(
                OrangeOAuth.OAUTH_URL,
                data=data,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"OAuth Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                expires_in_seconds = result.get('expires_in', 3600)
                expires_at = timezone.now() + timedelta(seconds=expires_in_seconds - 60)
                
                # Sauvegarder le token
                token = OAuthToken(
                    access_token=result['access_token'],
                    refresh_token=result.get('refresh_token', ''),
                    expires_in=expires_at
                )
                token.save()
                
                logger.info(f"Token sauvegardé - Length: {len(result['access_token'])}")
                return result['access_token']
            else:
                raise Exception(f"OAuth failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"Erreur OAuth: {e}")
            raise Exception(str(e))

    @staticmethod
    def normalize_senegal_phone(phone_number):
        """
        Normalise un numéro sénégalais au format Orange attendu
        Input: +221777123456, 221777123456, 777123456
        Output: +221777123456
        """
        if not phone_number:
            return None
            
        # Nettoyer le numéro
        clean = phone_number.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Supprimer le + initial pour traitement
        if clean.startswith('+'):
            clean = clean[1:]
        
        # Cas 1: Numéro complet avec code pays (221XXXXXXXXX)
        if clean.startswith('221') and len(clean) == 12:
            return f"+{clean}"
        
        # Cas 2: Numéro local sénégalais (7XXXXXXXX ou 3XXXXXXXX)
        elif (clean.startswith('7') or clean.startswith('3')) and len(clean) == 9:
            return f"+221{clean}"
        
        # Cas 3: Format 00221XXXXXXXXX
        elif clean.startswith('00221') and len(clean) == 14:
            return f"+{clean[2:]}"
        
        return None

    @staticmethod
    def validate_phone_number(phone_number):
        """Valide un numéro sénégalais selon les standards Orange"""
        normalized = OrangeOAuth.normalize_senegal_phone(phone_number)
        if not normalized:
            return False
        
        # Vérifier le format final: +221XXXXXXXXX
        clean = normalized[1:]  # Enlever le +
        return (
            clean.startswith('221') and 
            len(clean) == 12 and 
            clean.isdigit() and
            clean[3] in ['3', '7']  # Préfixes mobiles Sénégal
        )

    @staticmethod
    def send_sms(recipient_phone, message, sender_name=None):
        """
        Envoi SMS via l'API Orange - Version corrigée selon documentation
        """
        # ✅ Normalisation stricte du destinataire
        normalized_recipient = OrangeOAuth.normalize_senegal_phone(recipient_phone)
        if not normalized_recipient:
            raise ValueError(f"Numéro destinataire invalide: {recipient_phone}")
        
        if not OrangeOAuth.validate_phone_number(normalized_recipient):
            raise ValueError(f"Numéro destinataire non valide pour le Sénégal: {normalized_recipient}")
        
        if len(message) > 160:
            raise ValueError("Message trop long (max 160 caractères)")
        
        try:
            # Obtenir token d'accès
            access_token = OrangeOAuth.get_access_token()
            if not access_token:
                raise Exception("Impossible d'obtenir un token d'accès")
            
            # URL selon la documentation Orange avec encoding correct
            sender_encoded = urllib.parse.quote(OrangeOAuth.API_SENDER_PHONE, safe='')
            sms_url = f"{OrangeOAuth.SMS_BASE_URL_HTTPS}/smsmessaging/v1/outbound/tel%3A%2B{OrangeOAuth.COUNTRY_CODE}777567226/requests"
            
            # Payload conforme à la documentation Orange
            payload = {
                "outboundSMSMessageRequest": {
                    "address": f"tel:{normalized_recipient}",  # Format: tel:+221XXXXXXXXX
                    "senderAddress": f"tel:{OrangeOAuth.API_SENDER_PHONE}",  # Format: tel:+221777567226
                    "outboundSMSTextMessage": {
                        "message": message
                    }
                }
            }
            
            # Ajouter sender name si configuré
            if sender_name or OrangeOAuth.DEFAULT_SENDER_NAME:
                payload["outboundSMSMessageRequest"]["senderName"] = sender_name or OrangeOAuth.DEFAULT_SENDER_NAME
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Orange-SMS-Django/1.0'
            }
            
            logger.info(f"=== ENVOI SMS ===")
            logger.info(f"Destinataire normalisé: {normalized_recipient}")
            logger.info(f"URL: {sms_url}")
            logger.info(f"Payload: {payload}")
            
            response = requests.post(
                sms_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"SMS Response Status: {response.status_code}")
            logger.info(f"SMS Response Headers: {dict(response.headers)}")
            logger.info(f"SMS Response Body: {response.text}")
            
            # Vérification du code de succès selon la doc Orange
            if response.status_code == 201:
                result = response.json()
                sms_request = result.get('outboundSMSMessageRequest', {})
                resource_url = sms_request.get('resourceURL', '')
                
                # Extraire message ID du resourceURL
                message_id = None
                if resource_url:
                    try:
                        # Format: .../requests/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                        message_id = resource_url.split('/')[-1]
                    except:
                        message_id = resource_url
                
                logger.info(f"✅ SMS envoyé avec succès! ID: {message_id}")
                
                return {
                    'success': True,
                    'message_id': message_id,
                    'delivery_status': 'DeliveredToNetwork',  # Statut initial selon Orange
                    'recipient': normalized_recipient,
                    'sender_used': OrangeOAuth.API_SENDER_PHONE,
                    'sender_name': sender_name or OrangeOAuth.DEFAULT_SENDER_NAME,
                    'message': message,
                    'resource_url': resource_url,
                    'raw_response': result
                }
                
            elif response.status_code == 401:
                # Token expiré - retry automatique
                logger.warning("Token expiré, génération d'un nouveau...")
                OrangeOAuth.force_new_token()
                raise Exception("Token expiré, veuillez réessayer")
                
            elif response.status_code == 400:
                # Erreur de requête - analyser le détail
                try:
                    error_detail = response.json()
                    logger.error(f"Erreur 400 détail: {error_detail}")
                except:
                    pass
                raise Exception(f"Requête invalide (400): {response.text}")
                
            else:
                error_msg = f"SMS failed: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"Erreur envoi SMS: {e}")
            raise Exception(str(e))

    @staticmethod
    def send_sms_with_default_sender(recipient_phone, message):
        """Méthode simplifiée pour envoi SMS avec sender par défaut"""
        return OrangeOAuth.send_sms(
            recipient_phone=recipient_phone,
            message=message,
            sender_name=OrangeOAuth.DEFAULT_SENDER_NAME
        )

    @staticmethod
    def check_sms_balance():
        """Vérifie le solde SMS restant selon la doc Orange"""
        try:
            access_token = OrangeOAuth.get_access_token()
            if not access_token:
                raise Exception("Token non disponible")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # Endpoint selon documentation Orange
            url = f"{OrangeOAuth.SMS_BASE_URL_HTTPS}/sms/admin/v1/contracts"
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                contracts = response.json()
                if contracts and len(contracts) > 0:
                    contract = contracts[0]  # Premier contrat (Sénégal)
                    return {
                        'available_units': contract.get('availableUnits', 0),
                        'status': contract.get('status', 'UNKNOWN'),
                        'expiration_date': contract.get('expirationDate'),
                        'country': contract.get('country'),
                        'offer_name': contract.get('offerName')
                    }
            
            logger.warning(f"Erreur récupération solde: {response.status_code}")
            return None
            
        except Exception as e:
            logger.error(f"Erreur vérification solde: {e}")
            return None


class RealtimeNotificationService:
    """Service pour gérer les notifications temps réel via WebSockets"""
    
    @staticmethod
    def notify_new_message(user_id, conversation_id, message_data):
        """Notifie un utilisateur qu'il a reçu un nouveau message"""
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer non configuré - Notifications WebSocket désactivées")
                return False
            
            # Nom du groupe pour cet utilisateur
            user_group = f"user_{user_id}"
            
            # Message à envoyer via WebSocket
            notification = {
                'type': 'new_message',
                'conversation_id': conversation_id,
                'message': message_data,
                'timestamp': message_data.get('sent_at'),
                'user_id': user_id
            }
            
            # Envoyer la notification
            async_to_sync(channel_layer.group_send)(
                user_group,
                {
                    'type': 'send_notification',
                    'notification': notification
                }
            )
            
            logger.info(f"Notification nouveau message envoyée au groupe {user_group}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur notification temps réel: {e}")
            return False
    
    @staticmethod
    def notify_message_status_update(user_id, message_id, new_status):
        """Notifie la mise à jour du statut d'un message"""
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer non configuré")
                return False
            
            user_group = f"user_{user_id}"
            
            notification = {
                'type': 'message_status_update',
                'message_id': message_id,
                'status': new_status,
                'timestamp': timezone.now().isoformat()
            }
            
            async_to_sync(channel_layer.group_send)(
                user_group,
                {
                    'type': 'send_notification',
                    'notification': notification
                }
            )
            
            logger.info(f"Notification statut message envoyée: {message_id} -> {new_status}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur notification statut: {e}")
            return False