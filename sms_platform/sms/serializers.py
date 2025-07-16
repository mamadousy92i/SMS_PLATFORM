from rest_framework import serializers
from .models import SMSMessage, Conversation, Contact, MessageStatus

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('id', 'name', 'phone_number', 'created_at')
        read_only_fields = ('id', 'created_at')

class SMSMessageSerializer(serializers.ModelSerializer):
    is_sent_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = SMSMessage
        fields = (
            'id', 'sender_phone', 'recipient_phone', 'message', 
            'sent_at', 'is_sent', 'is_received', 'is_read', 
            'is_sent_by_user'
        )
        read_only_fields = ('id', 'sent_at', 'is_sent', 'is_received')

    def get_is_sent_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_phone == request.user.telephone
        return False

class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.ReadOnlyField()
    messages = SMSMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = (
            'id', 'contact_phone', 'contact_name', 'created_at', 
            'updated_at', 'last_message', 'last_message_time', 
            'unread_count', 'messages', 'is_archived'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        last_msg = obj.last_message
        return last_msg.message if last_msg else ""

    def get_last_message_time(self, obj):
        last_msg = obj.last_message
        return last_msg.sent_at if last_msg else obj.updated_at

class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des conversations"""
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.ReadOnlyField()

    class Meta:
        model = Conversation
        fields = (
            'id', 'contact_phone', 'contact_name', 'last_message', 
            'last_message_time', 'unread_count'
        )

    def get_last_message(self, obj):
        last_msg = obj.last_message
        return last_msg.message if last_msg else ""

    def get_last_message_time(self, obj):
        last_msg = obj.last_message
        return last_msg.sent_at if last_msg else obj.updated_at

class SendSMSSerializer(serializers.Serializer):
    recipient = serializers.CharField(max_length=15)
    message = serializers.CharField(max_length=160)
    conversation_id = serializers.IntegerField(required=False)
    # 🗑️ SUPPRIMÉ: sender_phone n'est plus nécessaire (Orange gère automatiquement)

    def validate_recipient(self, value):
        if not value.startswith('+') or len(value) < 10:
            raise serializers.ValidationError("Numéro de téléphone invalide.")
        return value

    def validate_message(self, value):
        if len(value) > 160:
            raise serializers.ValidationError("Le message ne doit pas dépasser 160 caractères.")
        return value

class CreateConversationSerializer(serializers.Serializer):
    contact_phone = serializers.CharField(max_length=15)
    contact_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_contact_phone(self, value):
        if not value.startswith('+') or len(value) < 10:
            raise serializers.ValidationError("Numéro de téléphone invalide.")
        return value