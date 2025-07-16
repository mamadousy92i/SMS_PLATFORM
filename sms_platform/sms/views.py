# sms/views.py - Vues complètes corrigées avec imports fixes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
import logging

from account.models import CustomUser
from account.services import OrangeOAuth

# ✅ Import corrigé pour RealtimeNotificationService
try:
    from account.services import RealtimeNotificationService
except ImportError:
    RealtimeNotificationService = None

# Imports corrects
from .serializers import (
    SendSMSSerializer, SMSMessageSerializer, ConversationSerializer,
    ConversationListSerializer, CreateConversationSerializer
)
from .models import SMSMessage, Conversation, Contact, MessageStatus

logger = logging.getLogger(__name__)

class ConversationListView(generics.ListAPIView):
    """Liste toutes les conversations de l'utilisateur"""
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            user=self.request.user,
            is_archived=False
        ).order_by('-updated_at')

class ConversationDetailView(generics.RetrieveAPIView):
    """Détails d'une conversation avec tous ses messages"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        
        # Marquer les messages comme lus
        updated_count = conversation.messages.filter(
            recipient_phone=request.user.telephone,
            is_read=False
        ).update(is_read=True)
        
        if updated_count > 0:
            logger.info(f"{updated_count} messages marques comme lus")  # ✅ Émoji supprimé
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

class ConversationMessagesView(generics.ListAPIView):
    """Messages d'une conversation spécifique"""
    serializer_class = SMSMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        return SMSMessage.objects.filter(
            conversation_id=conversation_id,
            conversation__user=self.request.user
        ).order_by('sent_at')

class CreateConversationView(APIView):
    """Créer une nouvelle conversation"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        if serializer.is_valid():
            contact_phone = serializer.validated_data['contact_phone']
            contact_name = serializer.validated_data.get('contact_name', '')

            # Valider le numéro de téléphone
            if not OrangeOAuth.validate_phone_number(contact_phone):
                return Response(
                    {"error": "Numéro de téléphone invalide. Format attendu: +221XXXXXXXXX"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Vérifier si la conversation existe déjà
            conversation, created = Conversation.objects.get_or_create(
                user=request.user,
                contact_phone=contact_phone,
                defaults={'contact_name': contact_name}
            )

            serializer = ConversationSerializer(conversation)
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            
            message = "Nouvelle conversation creee" if created else "Conversation existante recuperee"  # ✅ Émojis supprimés
            logger.info(f"{message} - {contact_phone}")
            
            return Response(serializer.data, status=status_code)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SendSMSView(APIView):
    """Envoyer un SMS via l'API Orange"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendSMSSerializer(data=request.data)
        if serializer.is_valid():
            recipient = serializer.validated_data['recipient']
            message = serializer.validated_data['message']
            conversation_id = serializer.validated_data.get('conversation_id')

            # Validation des numéros
            if not OrangeOAuth.validate_phone_number(recipient):
                return Response(
                    {"error": "Numéro destinataire invalide. Format attendu: +221XXXXXXXXX"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not OrangeOAuth.validate_phone_number(request.user.telephone):
                return Response(
                    {"error": "Votre numéro de téléphone est invalide. Contactez l'administrateur."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                with transaction.atomic():
                    # Récupérer ou créer la conversation
                    if conversation_id:
                        try:
                            conversation = Conversation.objects.get(
                                id=conversation_id,
                                user=request.user
                            )
                        except Conversation.DoesNotExist:
                            return Response(
                                {"error": "Conversation non trouvée"}, 
                                status=status.HTTP_404_NOT_FOUND
                            )
                    else:
                        conversation, created = Conversation.objects.get_or_create(
                            user=request.user,
                            contact_phone=recipient,
                            defaults={'contact_name': ''}
                        )

                    # Créer le message en base (en attente)
                    sms = SMSMessage.objects.create(
                        conversation=conversation,
                        sender_phone=request.user.telephone,
                        recipient_phone=recipient,
                        message=message,
                        is_sent=False  # En attente d'envoi
                    )

                    # Créer le statut initial
                    message_status = MessageStatus.objects.create(
                        message=sms,
                        status='sent'
                    )

                    try:
                        # Envoyer le SMS via Orange API
                        logger.info(f"Envoi SMS vers {recipient}")  # ✅ Émoji supprimé
                        
                        orange_response = OrangeOAuth.send_sms_with_default_sender(
                            recipient_phone=recipient,
                            message=message
                        )

                        # Mettre à jour le message avec les infos Orange
                        sms.is_sent = True
                        sms.message_id = orange_response.get('message_id')
                        sms.save()

                        # Mettre à jour le statut
                        message_status.status = 'delivered' if orange_response.get('delivery_status') == 'DeliveredToNetwork' else 'sent'
                        message_status.save()

                        logger.info(f"SMS envoye avec succes! ID: {orange_response.get('message_id')}")  # ✅ Émoji supprimé

                        # Notification temps réel pour l'expéditeur
                        if RealtimeNotificationService:
                            try:
                                message_data = {
                                    'id': sms.id,
                                    'sender_phone': sms.sender_phone,
                                    'recipient_phone': sms.recipient_phone,
                                    'message': sms.message,
                                    'sent_at': sms.sent_at.isoformat(),
                                    'is_sent_by_user': True,
                                    'status': message_status.status
                                }
                                
                                RealtimeNotificationService.notify_new_message(
                                    user_id=request.user.id,
                                    conversation_id=conversation.id,
                                    message_data=message_data
                                )
                            except Exception as notif_error:
                                logger.warning(f"Erreur notification temps reel: {notif_error}")  # ✅ Émoji supprimé

                        # Sérialiser la réponse
                        message_serializer = SMSMessageSerializer(sms, context={'request': request})
                        
                        return Response({
                            "message": "SMS envoyé avec succès",
                            "sms": message_serializer.data,
                            "conversation_id": conversation.id,
                            "orange_message_id": orange_response.get('message_id'),
                            "delivery_status": orange_response.get('delivery_status')
                        }, status=status.HTTP_200_OK)

                    except Exception as orange_error:
                        # Erreur lors de l'envoi via Orange
                        logger.error(f"Erreur Orange API: {orange_error}")  # ✅ Émoji supprimé
                        
                        # Marquer le message comme échoué
                        sms.is_sent = False
                        sms.save()
                        
                        message_status.status = 'failed'
                        message_status.error_message = str(orange_error)
                        message_status.save()

                        return Response({
                            "error": f"Erreur lors de l'envoi SMS: {str(orange_error)}",
                            "sms_id": sms.id,
                            "conversation_id": conversation.id
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except Exception as e:
                logger.error(f"Erreur generale lors de l'envoi SMS: {e}")  # ✅ Émoji supprimé
                return Response(
                    {"error": f"Erreur interne: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SearchConversationsView(APIView):
    """Rechercher dans les conversations"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)

        conversations = Conversation.objects.filter(
            user=request.user,
            is_archived=False
        ).filter(
            Q(contact_name__icontains=query) |
            Q(contact_phone__icontains=query) |
            Q(messages__message__icontains=query)
        ).distinct().order_by('-updated_at')

        serializer = ConversationListSerializer(conversations, many=True)
        return Response(serializer.data)

class MarkAsReadView(APIView):
    """Marquer les messages d'une conversation comme lus"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=request.user
            )
            
            # Marquer tous les messages reçus comme lus
            updated_count = conversation.messages.filter(
                recipient_phone=request.user.telephone,
                is_read=False
            ).update(is_read=True)
            
            logger.info(f"{updated_count} messages marques comme lus pour conversation {conversation_id}")  # ✅ Émoji supprimé
            
            return Response({
                "message": "Messages marqués comme lus",
                "updated_count": updated_count
            })
        
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation non trouvée"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class SMSHistoryView(APIView):
    """Historique global des SMS"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = SMSMessage.objects.filter(
            Q(sender_phone=request.user.telephone) |
            Q(recipient_phone=request.user.telephone)
        ).order_by('-sent_at')
        
        serializer = SMSMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class DeliveryReceiptView(APIView):
    """Reçoit les notifications de livraison de l'API Orange"""
    permission_classes = []  # Pas d'authentification nécessaire pour les notifications

    def post(self, request):
        try:
            data = request.data.get('deliveryInfoNotification', {})
            delivery_info = data.get('deliveryInfo', {})
            message_id = delivery_info.get('messageId', 'N/A')
            address = delivery_info.get('address', 'N/A')
            delivery_status = delivery_info.get('deliveryStatus', 'N/A')

            logger.info(f"Delivery Receipt recu - Message ID: {message_id}, Statut: {delivery_status}, Destinataire: {address}")  # ✅ Émoji supprimé

            # Mettre à jour le statut du message dans la base
            try:
                sms = SMSMessage.objects.get(message_id=message_id)
                
                # Mettre à jour le statut
                if hasattr(sms, 'status'):
                    sms.status.status = delivery_status.lower()
                    sms.status.save()
                else:
                    MessageStatus.objects.create(
                        message=sms,
                        status=delivery_status.lower()
                    )
                
                logger.info(f"Statut mis a jour pour SMS {message_id}: {delivery_status}")  # ✅ Émoji supprimé
                
                # Notification temps réel du changement de statut
                if RealtimeNotificationService:
                    try:
                        # Trouver l'utilisateur qui a envoyé le message
                        user = CustomUser.objects.get(telephone=sms.sender_phone)
                        RealtimeNotificationService.notify_message_status_update(
                            user_id=user.id,
                            message_id=sms.id,
                            new_status=delivery_status.lower()
                        )
                    except CustomUser.DoesNotExist:
                        logger.warning(f"Utilisateur non trouve pour le numero {sms.sender_phone}")  # ✅ Émoji supprimé
                    except Exception as notif_error:
                        logger.warning(f"Erreur notification statut: {notif_error}")
                
            except SMSMessage.DoesNotExist:
                logger.warning(f"SMS avec message_id {message_id} non trouve")  # ✅ Émoji supprimé

            return Response({"status": "Notification reçue"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erreur dans Delivery Receipt: {str(e)}")  # ✅ Émoji supprimé
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReceiveSMSWebhookView(APIView):
    """Webhook Orange pour recevoir les SMS entrants en temps réel"""
    permission_classes = []  # Pas d'auth nécessaire pour les webhooks Orange
    
    def post(self, request):
        try:
            logger.info("=== RECEPTION SMS WEBHOOK ===")  # ✅ Émoji supprimé
            logger.info(f"Headers: {dict(request.headers)}")
            logger.info(f"Body: {request.data}")
            
            # Format webhook Orange pour SMS reçus (MO - Mobile Originated)
            data = request.data.get('inboundSMSMessageNotification', {})
            sms_data = data.get('inboundSMSMessage', {})
            
            # Extraire les données du SMS reçu
            sender_address = sms_data.get('senderAddress', '')
            sender_phone = sender_address.replace('tel:+', '+').replace('tel:', '')
            recipient_address = sms_data.get('destinationAddress', '')
            recipient_phone = recipient_address.replace('tel:+', '+').replace('tel:', '')
            message_text = sms_data.get('message', '')
            received_at = sms_data.get('dateTime')
            message_id = sms_data.get('messageId', '')
            
            logger.info(f"SMS recu de {sender_phone} vers {recipient_phone}")  # ✅ Émoji supprimé
            logger.info(f"Message: {message_text}")  # ✅ Émoji supprimé
            
            # Validation des données
            if not sender_phone or not message_text:
                logger.warning("Donnees SMS incompletes")  # ✅ Émoji supprimé
                return Response({
                    "error": "Données SMS incomplètes",
                    "required": ["senderAddress", "message"]
                }, status=400)
            
            # Trouver l'utilisateur destinataire (celui qui a reçu le SMS)
            try:
                # Le destinataire est l'utilisateur de votre plateforme
                user = CustomUser.objects.get(telephone=recipient_phone)
                logger.info(f"Utilisateur trouve: {user.username}")  # ✅ Émoji supprimé
                
            except CustomUser.DoesNotExist:
                logger.error(f"Aucun utilisateur avec le numero {recipient_phone}")  # ✅ Émoji supprimé
                return Response({
                    "error": f"Utilisateur non trouvé pour le numéro {recipient_phone}",
                    "help": "Vérifiez que le numéro est bien enregistré"
                }, status=404)
            
            try:
                with transaction.atomic():
                    # Trouver ou créer la conversation
                    conversation, created = Conversation.objects.get_or_create(
                        user=user,
                        contact_phone=sender_phone,
                        defaults={'contact_name': ''}
                    )
                    
                    if created:
                        logger.info(f"Nouvelle conversation creee avec {sender_phone}")  # ✅ Émoji supprimé
                    
                    # Créer le message reçu
                    received_sms = SMSMessage.objects.create(
                        conversation=conversation,
                        sender_phone=sender_phone,
                        recipient_phone=recipient_phone,
                        message=message_text,
                        is_sent=False,      # Ce n'est pas un message envoyé
                        is_received=True,   # C'est un message reçu
                        is_read=False,      # Pas encore lu
                        message_id=message_id
                    )
                    
                    # Créer le statut du message
                    MessageStatus.objects.create(
                        message=received_sms,
                        status='delivered'
                    )
                    
                    logger.info(f"Message sauvegarde avec ID: {received_sms.id}")  # ✅ Émoji supprimé
                    
                    # Notification temps réel
                    if RealtimeNotificationService:
                        try:
                            message_data = {
                                'id': received_sms.id,
                                'sender_phone': sender_phone,
                                'recipient_phone': recipient_phone,
                                'message': message_text,
                                'sent_at': received_sms.sent_at.isoformat(),
                                'is_sent_by_user': False,
                                'is_received': True,
                                'is_read': False
                            }
                            
                            RealtimeNotificationService.notify_new_message(
                                user_id=user.id,
                                conversation_id=conversation.id,
                                message_data=message_data
                            )
                            logger.info("Notification temps reel envoyee")  # ✅ Émoji supprimé
                        except Exception as notif_error:
                            logger.warning(f"Erreur notification temps reel: {notif_error}")  # ✅ Émoji supprimé
                    
                    return Response({
                        "status": "SMS reçu et traité avec succès",
                        "message_id": received_sms.id,
                        "conversation_id": conversation.id,
                        "sender": sender_phone,
                        "recipient": recipient_phone,
                        "message_preview": message_text[:50] + "..." if len(message_text) > 50 else message_text,
                        "notification_sent": True
                    }, status=200)
                    
            except Exception as db_error:
                logger.error(f"Erreur base de donnees: {db_error}")  # ✅ Émoji supprimé
                return Response({
                    "error": f"Erreur sauvegarde: {str(db_error)}"
                }, status=500)
                
        except Exception as e:
            logger.error(f"Erreur generale reception SMS: {e}")  # ✅ Émoji supprimé
            return Response({
                "error": f"Erreur traitement webhook: {str(e)}",
                "help": "Vérifiez le format des données envoyées par Orange"
            }, status=500)
    
    def get(self, request):
        """Endpoint de vérification pour Orange (optionnel)"""
        return Response({
            "status": "Webhook SMS actif",
            "endpoint": "POST /api/sms/receive-webhook/",
            "expected_format": {
                "inboundSMSMessageNotification": {
                    "inboundSMSMessage": {
                        "senderAddress": "tel:+221XXXXXXXXX",
                        "destinationAddress": "tel:+221777567226",
                        "message": "Réponse du client",
                        "dateTime": "2025-01-01T12:00:00",
                        "messageId": "unique_id"
                    }
                }
            }
        })