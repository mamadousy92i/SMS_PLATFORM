import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, User, Search, Phone, MoreVertical, ArrowLeft, Plus, X, Wifi, WifiOff } from 'lucide-react';
import { getConversations, getConversationDetail,sendMessageToConversation, createConversation, markMessagesAsRead } from '../utils/api';
import { useLocation } from 'react-router-dom';
import wsService from '../utils/websocket';
import notificationService from '../utils/notifications';


const MessageInput = React.memo(({ value, onChange, onSend, isLoading }) => {
  // Utiliser une ref pour le textarea
  const textareaRef = React.useRef(null);
  
  // Focus automatique quand le composant est monté ou quand la conversation change
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-end space-x-3">
      <div className="flex-1">
      <input
  type="text"
  ref={textareaRef} // peut rester ref
  value={value}
  onChange={onChange}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  }}
  placeholder="Tapez votre message..."
  className="px-4 py-3 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
/>

      </div>
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        className="flex justify-center items-center bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 p-3 rounded-lg text-white transition-colors disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin"></div>
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
  );
});

const NewConversationModal = ({ isOpen, onClose, onConversationCreated }) => {
  const [formData, setFormData] = useState({
    contact_phone: '',
    contact_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.contact_phone.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const conversation = await createConversation(formData);
      onConversationCreated(conversation);
      setFormData({ contact_phone: '', contact_name: '' });
      onClose();
      notificationService.success('Nouvelle conversation créée');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Erreur lors de la création';
      setError(errorMsg);
      notificationService.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhone = (phone) => {
    return phone.startsWith('+') && phone.length >= 10;
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="font-semibold text-gray-900 text-xl">
            Nouvelle conversation
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+221123456789"
              className="px-3 py-2 border border-gray-300 focus:border-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500 w-full"
              required
            />
            {formData.contact_phone && !validatePhone(formData.contact_phone) && (
              <p className="mt-1 text-red-500 text-sm">
                Le numéro doit commencer par + et avoir au moins 10 caractères
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Nom du contact (optionnel)
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder="Nom du contact"
              className="px-3 py-2 border border-gray-300 focus:border-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500 w-full"
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.contact_phone.trim() || !validatePhone(formData.contact_phone) || isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors"
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin"></div>
                  Création...
                </div>
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Channels = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const handleMessageChange = useCallback((e) => {
    console.log('Avant setNewMessage:', e.target.value);
    setNewMessage(e.target.value);
  }, []);
  

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || isLoading) return;

    setIsLoading(true);
    setError('');
    
    try {
      const messageData = {
        recipient: selectedConversation.contact_phone,
        message: newMessage.trim(),
        conversation_id: selectedConversation.id
      };

      const response = await sendMessageToConversation(messageData);
      
      // Ajouter le message à la conversation locale
      const newMsg = response.sms;
      setSelectedConversation(prev => {
        if (!prev) return prev;
      
        const updatedMessages = [...(prev.messages || []), newMsg];
      
        return {
          ...prev,
          messages: updatedMessages
        };
      });
      

      // Mettre à jour la liste des conversations
      setConversations(prev => {
        if (!Array.isArray(prev)) {
          console.warn('conversations n\'est pas un tableau:', prev);
          return [];
        }
        
        return prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                last_message: newMessage.trim(),
                last_message_time: new Date().toISOString()
              }
            : conv
        );
      });
      
      setNewMessage('');
      notificationService.success('Message envoyé');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'envoi du SMS';
      setError(errorMsg);
      notificationService.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, selectedConversation, isLoading]);

  // Charger les conversations au démarrage
  useEffect(() => {
    fetchConversations();
    initWebSocket();
    
    return () => {
      wsService.disconnect();
    };
  }, []);

  // Initialiser WebSocket
  const initWebSocket = () => {
    const token = localStorage.getItem('token');
    if (token) {
      wsService.on('connected', () => {
        console.log('WebSocket connecté');
        setIsWebSocketConnected(true);
        notificationService.success('Connexion temps réel établie');
      });

      wsService.on('connection_established', (data) => {
        console.log('Connexion établie:', data);
        setIsWebSocketConnected(true);
        notificationService.success(`Connecté en tant que ${data.user?.username || 'utilisateur'}`);
      });

      wsService.on('disconnected', () => {
        console.log('WebSocket déconnecté');
        setIsWebSocketConnected(false);
        notificationService.warning('Connexion temps réel perdue');
      });

      wsService.on('new_message', (data) => {
        console.log('Nouveau message reçu:', data);
        handleNewMessageReceived(data);
      });

      wsService.on('message_status_update', (data) => {
        console.log('Statut message mis à jour:', data);
        handleMessageStatusUpdate(data);
      });

      wsService.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        notificationService.error('Erreur de connexion temps réel');
      });

      wsService.on('pong', (data) => {
        console.log('Pong reçu:', data);
      });

      wsService.connect(token);
    }
  };

  // Gérer nouveau message reçu via WebSocket
  const handleNewMessageReceived = (data) => {
    const { conversation_id, message } = data;
    
    if (!message) {
      console.warn('Message data manquant dans la notification');
      return;
    }
    
    setConversations(prev => {
      if (!Array.isArray(prev)) {
        console.warn('conversations n\'est pas un tableau:', prev);
        return [];
      }
      
      return prev.map(conv => {
        if (conv.id === conversation_id) {
          const updatedMessages = [...(conv.messages || []), message];
          return {
            ...conv,
            messages: updatedMessages,
            last_message: message.message,
            last_message_time: message.sent_at,
            unread_count: message.is_sent_by_user ? conv.unread_count : conv.unread_count + 1
          };
        }
        return conv;
      });
    });

    // Mettre à jour la conversation sélectionnée
    if (selectedConversation && selectedConversation.id === conversation_id) {
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...(prev.messages || []), message]
      }));
      
      // Marquer comme lu automatiquement si la conversation est ouverte
      if (!message.is_sent_by_user) {
        setTimeout(() => {
          markMessagesAsRead(conversation_id);
          wsService.markAsRead(conversation_id);
        }, 500);
      }
    } else if (!message.is_sent_by_user) {
      // Afficher notification si conversation non ouverte et message reçu
      notificationService.newMessageToast(message);
      notificationService.notifyNewMessage(message);
    }
  };

  // Gérer mise à jour statut message
  const handleMessageStatusUpdate = (data) => {
    const { message_id, status } = data;
    
    setConversations(prev => {
      if (!Array.isArray(prev)) {
        console.warn('conversations n\'est pas un tableau:', prev);
        return [];
      }
      
      return prev.map(conv => ({
        ...conv,
        messages: conv.messages?.map(msg => 
          msg.id === message_id ? { ...msg, status } : msg
        ) || []
      }));
    });

    // Mettre à jour dans la conversation sélectionnée
    if (selectedConversation) {
      setSelectedConversation(prev => ({
        ...prev,
        messages: prev.messages?.map(msg => 
          msg.id === message_id ? { ...msg, status } : msg
        ) || []
      }));
    }

    // Notification de statut
    notificationService.notifyDeliveryStatus(message_id, status);
  };

  // Gérer l'ouverture automatique depuis le Dashboard
  useEffect(() => {
    if (location.state?.openConversation && Array.isArray(conversations) && conversations.length > 0) {
      const phoneToOpen = location.state.openConversation;
      const message = location.state.message;
      
      // Afficher le message de succès
      if (message) {
        setSuccessMessage(message);
        notificationService.success(message);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      // Chercher et ouvrir la conversation correspondante
      setTimeout(() => {
        const conversation = conversations.find(conv => 
          conv.contact_phone === phoneToOpen
        );
        if (conversation) {
          handleConversationSelect(conversation);
        }
      }, 500);
    }
  }, [location.state, conversations]);

  // Auto-refresh optimisé (fallback si WebSocket déconnecté)
  useEffect(() => {
    let interval;
    
    if (!isWebSocketConnected) {
      interval = setInterval(() => {
        fetchConversations();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWebSocketConnected]);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      console.log('Réponse API conversations:', data);
      
      if (Array.isArray(data)) {
        setConversations(data);
      } else if (data && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      } else if (data && typeof data === 'object') {
        const conversationsArray = Object.values(data).find(val => Array.isArray(val));
        setConversations(conversationsArray || []);
      } else {
        console.warn('Format de réponse inattendu:', data);
        setConversations([]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setError('Erreur lors du chargement des conversations');
      setConversations([]);
      notificationService.error('Erreur lors du chargement des conversations');
    }
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    
    try {
      const detailedConversation = await getConversationDetail(conversation.id);
      setSelectedConversation(detailedConversation);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      notificationService.error("Impossible de charger l'historique.");
    }

    if (conversation.unread_count > 0) {
      try {
        await markMessagesAsRead(conversation.id);
        wsService.markAsRead(conversation.id);
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, unread_count: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    }
  };

  const handleConversationCreated = (newConversation) => {
    setConversations(prev => {
      if (!Array.isArray(prev)) {
        console.warn('conversations n\'est pas un tableau, initialisation:', prev);
        return [newConversation];
      }
      return [newConversation, ...prev];
    });
    setSelectedConversation(newConversation);
  };

  const filteredConversations = (() => {
    if (!Array.isArray(conversations)) {
      console.warn('conversations n\'est pas un tableau dans le filtre:', conversations);
      return [];
    }
    
    if (!searchTerm.trim()) {
      return conversations;
    }
    
    return conversations.filter(conv => {
      if (!conv) return false;
      
      const name = conv.contact_name || '';
      const phone = conv.contact_phone || '';
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) || 
            phone.includes(searchTerm); 
    });
  })();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const ConversationsList = () => (
    <div className="flex flex-col bg-white border-gray-200 border-r w-full lg:w-96 xl:w-[420px] h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-gray-200 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900 text-xl">Messages</h2>
          <div className="flex items-center space-x-2">
            {/* Indicateur WebSocket */}
            <div className={`p-1 rounded-full ${isWebSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isWebSocketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg text-white transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 pointer-events-none transform" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pr-4 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="py-8 text-gray-500 text-center">
            <MessageSquare className="mx-auto mb-4 w-12 h-12 text-gray-300" />
            <p>Aucune conversation trouvée</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-emerald-200' : ''
              }`}
            >
                <div className="flex items-start space-x-3">
                  <div className="flex flex-shrink-0 justify-center items-center bg-emerald-100 rounded-full w-12 h-12">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {conversation.contact_name || conversation.contact_phone}
                      </p>
                      <div className="flex flex-shrink-0 items-center space-x-2">
                        <p className="font-medium text-gray-500 text-xs">
                          {formatTime(conversation.last_message_time)}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="flex justify-center items-center bg-emerald-500 rounded-full w-5 h-5 font-medium text-white text-xs">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mb-2 text-gray-600 text-sm truncate leading-relaxed">
                      {conversation.last_message}
                    </p>
                    <p className="font-medium text-gray-400 text-xs">
                      {conversation.contact_phone}
                    </p>
                  </div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ChatWindow = () => {
    if (!selectedConversation) {
      return (
        <div className="flex flex-1 justify-center items-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="mx-auto mb-4 w-16 h-16 text-gray-300" />
            <h3 className="mb-2 font-medium text-gray-900 text-lg">
              Sélectionnez une conversation
            </h3>
            <p className="text-gray-500">
              Choisissez une conversation dans la liste pour commencer à discuter
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col flex-1 bg-white">
        {/* Header de la conversation */}
        <div className="flex-shrink-0 bg-white p-4 border-gray-200 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex justify-center items-center bg-emerald-100 rounded-full w-12 h-12">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {selectedConversation.contact_name || selectedConversation.contact_phone}
                </h3>
                <p className="text-gray-500 text-sm">
                  {selectedConversation.contact_phone}
                  {isWebSocketConnected && <span className="ml-2 text-green-500">● En ligne</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 p-4 min-h-0 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
            selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_sent_by_user !== false ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    message.is_sent_by_user !== false
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm break-words leading-relaxed">{message.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p
                      className={`text-xs ${
                        message.is_sent_by_user !== false ? 'text-emerald-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.sent_at)}
                    </p>
                    {message.is_sent_by_user !== false && (
                      <span className={`text-xs ml-2 ${
                        message.status === 'delivered' ? 'text-emerald-200' : 
                        message.status === 'failed' ? 'text-red-300' : 'text-emerald-100'
                      }`}>
                        {message.status === 'delivered' ? '✓✓' : 
                         message.status === 'failed' ? '✗' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-gray-500 text-center">
              <MessageSquare className="mx-auto mb-4 w-12 h-12 text-gray-300" />
              <p>Aucun message dans cette conversation</p>
              <p className="text-sm">Envoyez le premier message !</p>
            </div>
          )}
        </div>

        {/* Zone de saisie */}
        <div className="flex-shrink-0 bg-white p-4 border-gray-200 border-t">
          {error && (
            <div className="bg-red-50 mb-3 p-3 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <MessageInput
            value={newMessage}
            onChange={handleMessageChange}
            onSend={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-50 mb-4 p-4 border border-green-200 rounded-lg">
            <p className="font-medium text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-bold text-gray-900 text-3xl">Channels</h1>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-gray-600">Gérez vos conversations SMS</p>
            {isWebSocketConnected ? (
              <span className="flex items-center text-green-600 text-sm">
                <Wifi className="mr-1 w-4 h-4" />
                Temps réel actif
              </span>
            ) : (
              <span className="flex items-center text-orange-600 text-sm">
                <WifiOff className="mr-1 w-4 h-4" />
                Mode hors ligne
              </span>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Liste des conversations - cachée sur mobile quand une conversation est sélectionnée */}
            <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-96 xl:w-[420px] h-full flex-shrink-0`}>
              <ConversationsList />
            </div>
            
            {/* Fenêtre de chat - visible sur mobile seulement quand une conversation est sélectionnée */}
            <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 h-full min-w-0`}>
              <ChatWindow />
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour nouvelle conversation */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default Channels;