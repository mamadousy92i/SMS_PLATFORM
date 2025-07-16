# sms/admin.py
from django.contrib import admin
from .models import SMSMessage, Conversation, Contact, MessageStatus

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'user', 'created_at')
    search_fields = ('name', 'phone_number', 'user__username')
    list_filter = ('created_at',)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('user', 'contact_name', 'contact_phone', 'message_count', 'updated_at', 'is_archived')
    search_fields = ('user__username', 'contact_name', 'contact_phone')
    list_filter = ('is_archived', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Nb Messages'

@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'sender_phone', 'recipient_phone', 'message_preview', 'sent_at', 'is_sent', 'is_read')
    search_fields = ('sender_phone', 'recipient_phone', 'message', 'conversation__contact_name')
    list_filter = ('is_sent', 'is_received', 'is_read', 'sent_at')
    readonly_fields = ('sent_at',)

    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'

@admin.register(MessageStatus)
class MessageStatusAdmin(admin.ModelAdmin):
    list_display = ('message', 'status', 'updated_at')
    list_filter = ('status', 'updated_at')
    search_fields = ('message__message', 'error_message')