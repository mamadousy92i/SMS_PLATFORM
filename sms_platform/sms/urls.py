# sms/urls.py - URLs mis à jour avec webhook de réception

from django.urls import path
from .views import (
    SendSMSView, SMSHistoryView, ConversationListView,
    ConversationDetailView, ConversationMessagesView,
    CreateConversationView, SearchConversationsView,
    MarkAsReadView, DeliveryReceiptView, ReceiveSMSWebhookView
)

urlpatterns = [
    # Envoi et gestion des conversations
    path('send/', SendSMSView.as_view(), name='send-sms'),
    path('history/', SMSHistoryView.as_view(), name='sms-history'),
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', CreateConversationView.as_view(), name='conversation-create'),
    path('conversations/search/', SearchConversationsView.as_view(), name='conversation-search'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<int:conversation_id>/mark-read/', MarkAsReadView.as_view(), name='mark-as-read'),
    
    # 🆕 Webhooks Orange
    path('delivery-receipt/', DeliveryReceiptView.as_view(), name='delivery-receipt'),
    path('receive-webhook/', ReceiveSMSWebhookView.as_view(), name='receive-sms-webhook'),
]