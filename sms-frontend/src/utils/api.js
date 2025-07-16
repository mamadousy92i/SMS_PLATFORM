import axios from 'axios';
import { refreshToken } from './auth';

// Créer une instance Axios avec la base URL du backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs (ex. : token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 (Unauthorized) et pas déjà en train de retenter
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Tenter de rafraîchir le token
        const newToken = await refreshToken();
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // Réessayer la requête
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Fonctions API Authentication
export const register = async (data) => {
  const response = await api.post('account/register/', data);
  return response.data;
};

export const login = async (data) => {
  const response = await axios.post('http://localhost:8000/api/token/', data); // Sans intercepteur pour login
  return response.data;
};

// Fonctions API SMS et Conversations
export const sendSMS = async (data) => {
  const response = await api.post('sms/send/', data);
  return response.data;
};

// Obtenir toutes les conversations de l'utilisateur
export const getConversations = async () => {
  const response = await api.get('sms/conversations/');
  return response.data;
};

// Obtenir les détails d'une conversation avec tous ses messages
export const getConversationDetail = async (conversationId) => {
  const response = await api.get(`sms/conversations/${conversationId}/`);
  return response.data;
};

// Obtenir les messages d'une conversation spécifique
export const getConversationMessages = async (conversationId) => {
  const response = await api.get(`sms/conversations/${conversationId}/messages/`);
  return response.data;
};

// Envoyer un message dans une conversation existante
export const sendMessageToConversation = async (messageData) => {
  const response = await api.post('sms/send/', messageData);
  return response.data;
};

// Créer une nouvelle conversation
export const createConversation = async (contactData) => {
  const response = await api.post('sms/conversations/create/', contactData);
  return response.data;
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId) => {
  const response = await api.patch(`sms/conversations/${conversationId}/mark-read/`);
  return response.data;
};

// Rechercher des conversations
export const searchConversations = async (query) => {
  const response = await api.get(`sms/conversations/search/?q=${encodeURIComponent(query)}`);
  return response.data;
};

// Obtenir l'historique global des SMS (ancien endpoint)
export const getHistory = async () => {
  const response = await api.get('sms/history/');
  return response.data;
};

// 🆕 Nouvelles fonctions API pour les fonctionnalités temps réel

// Obtenir les statistiques des conversations
export const getConversationStats = async () => {
  try {
    const response = await api.get('sms/conversations/stats/');
    return response.data;
  } catch (error) {
    // Si l'endpoint n'existe pas encore, retourner des stats par défaut
    console.warn('Endpoint stats non disponible, calcul local');
    const conversations = await getConversations();
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
    const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    
    return {
      total_conversations: totalConversations,
      total_messages: totalMessages,
      unread_messages: unreadCount,
      today_messages: 0 // Difficile à calculer sans date précise
    };
  }
};

// Récupérer les messages non lus
export const getUnreadMessages = async () => {
  try {
    const conversations = await getConversations();
    const unreadMessages = [];
    
    conversations.forEach(conv => {
      if (conv.unread_count > 0 && conv.messages) {
        const unread = conv.messages.filter(msg => !msg.is_read && !msg.is_sent_by_user);
        unreadMessages.push(...unread);
      }
    });
    
    return unreadMessages;
  } catch (error) {
    console.error('Erreur récupération messages non lus:', error);
    return [];
  }
};

// Mettre à jour le statut d'un message
export const updateMessageStatus = async (messageId, status) => {
  try {
    const response = await api.patch(`sms/messages/${messageId}/status/`, { status });
    return response.data;
  } catch (error) {
    console.warn('Endpoint update status non disponible');
    return null;
  }
};

// Vérifier la connectivité avec le backend
export const checkApiHealth = async () => {
  try {
    const response = await api.get('health/');
    return { status: 'ok', ...response.data };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

// Helper pour gérer les erreurs d'API de manière uniforme
export const handleApiError = (error) => {
  if (error.response) {
    // Erreur de réponse du serveur
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.detail || 'Erreur serveur';
    
    switch (status) {
      case 400:
        return { type: 'validation', message };
      case 401:
        return { type: 'auth', message: 'Session expirée, veuillez vous reconnecter' };
      case 403:
        return { type: 'permission', message: 'Accès refusé' };
      case 404:
        return { type: 'notfound', message: 'Ressource non trouvée' };
      case 500:
        return { type: 'server', message: 'Erreur serveur interne' };
      default:
        return { type: 'unknown', message };
    }
  } else if (error.request) {
    // Erreur réseau
    return { type: 'network', message: 'Erreur de connexion au serveur' };
  } else {
    // Autre erreur
    return { type: 'client', message: error.message };
  }
};

export default api;