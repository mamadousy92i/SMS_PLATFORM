# sms/models.py
from django.db import models
from django.conf import settings

class Contact(models.Model):
    """Modèle pour gérer les contacts"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'phone_number']

    def __str__(self):
        return f"{self.name or self.phone_number} - {self.user.username}"

class Conversation(models.Model):
    """Modèle pour gérer les conversations entre deux participants"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contact_phone = models.CharField(max_length=15)
    contact_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        unique_together = ['user', 'contact_phone']

    def __str__(self):
        return f"Conversation {self.user.username} - {self.contact_name or self.contact_phone}"

    @property
    def last_message(self):
        return self.messages.order_by('-sent_at').first()

    @property
    def unread_count(self):
        return self.messages.filter(
            is_read=False, 
            sender_phone=self.contact_phone
        ).count()

class SMSMessage(models.Model):
    """Modèle mis à jour pour les messages SMS avec conversations"""
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender_phone = models.CharField(max_length=15)
    recipient_phone = models.CharField(max_length=15)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=True)
    is_received = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    message_id = models.CharField(max_length=100, blank=True, null=True)  # ID de l'API Orange

    def __str__(self):
        return f"SMS de {self.sender_phone} à {self.recipient_phone} le {self.sent_at}"

    def save(self, *args, **kwargs):
        # Auto-créer ou récupérer la conversation
        if not self.conversation_id:
            user_phone = None
            contact_phone = None
            
            # Déterminer qui est l'utilisateur et qui est le contact
            try:
                from account.models import CustomUser
                user = CustomUser.objects.get(telephone=self.sender_phone)
                user_phone = self.sender_phone
                contact_phone = self.recipient_phone
            except CustomUser.DoesNotExist:
                try:
                    user = CustomUser.objects.get(telephone=self.recipient_phone)
                    user_phone = self.recipient_phone
                    contact_phone = self.sender_phone
                except CustomUser.DoesNotExist:
                    raise ValueError("Aucun utilisateur trouvé pour ce message")

            # Créer ou récupérer la conversation
            conversation, created = Conversation.objects.get_or_create(
                user=user,
                contact_phone=contact_phone,
                defaults={'contact_name': ''}
            )
            self.conversation = conversation

        super().save(*args, **kwargs)

        # Mettre à jour le timestamp de la conversation
        self.conversation.updated_at = self.sent_at
        self.conversation.save()

class MessageStatus(models.Model):
    """Statuts de livraison des messages"""
    STATUS_CHOICES = [
        ('sent', 'Envoyé'),
        ('delivered', 'Livré'),
        ('read', 'Lu'),
        ('failed', 'Échec'),
    ]
    
    message = models.OneToOneField(SMSMessage, on_delete=models.CASCADE, related_name='status')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    updated_at = models.DateTimeField(auto_now=True)
    error_message = models.TextField(blank=True)

    def __str__(self):
        return f"Statut: {self.status} - {self.message}"