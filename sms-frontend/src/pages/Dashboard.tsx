import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  Upload,
  User,
  Phone,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { sendSMS, getHistory } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import wsService from '../utils/websocket';
import notificationService from '../utils/notifications';

// Type definitions
interface Message {
  id: string;
  recipient: string;
  message: string;
  is_sent: boolean;
  is_received: boolean;
  sent_at: string;
  status?: string;
}

interface Stats {
  totalSent: number;
  totalReceived: number;
  successRate: number;
  thisMonth: number;
}

interface QuickMessage {
  recipient: string;
  message: string;
}

interface BulkMessage {
  recipients: string;
  message: string;
  file: File | null;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}

// Utility function for phone number validation
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+221\d{9}$/;
  return phoneRegex.test(phone.trim());
};

// Reusable Textarea component
const TextareaField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
  maxLength?: number;
  id: string;
}> = ({ label, value, onChange, placeholder, rows, maxLength, id }) => (
  <div>
    <label htmlFor={id} className="block mb-2 font-medium text-gray-700 text-sm">
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="px-3 py-2 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full resize-none"
      aria-describedby={`${id}-description`}
    />
    {maxLength && (
      <p id={`${id}-description`} className="mt-1 text-gray-500 text-sm">
        {value.length}/{maxLength} caractères
      </p>
    )}
  </div>
);

const BulkSendForm: React.FC<{
  bulkMessage: { recipients: string; message: string; file: File | null };
  onRecipientsChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  isLoading: boolean;
  error: string;
}> = React.memo(({
  bulkMessage,
  onRecipientsChange,
  onMessageChange,
  onFileChange,
  onSend,
  isLoading,
  error
}) => {
  // La logique de comptage et de validation reste ici, à l'intérieur du composant
  const validatePhoneNumber = (phone: string): boolean => /^\+221\d{9}$/.test(phone.trim());

  const recipientCount = bulkMessage.recipients
    .split('\n')
    .filter((line) => line.trim()).length;

  const validRecipientCount = bulkMessage.recipients
    .split('\n')
    .filter((line) => validatePhoneNumber(line.trim())).length;
    
  return (
    <div className="bg-white shadow-md p-6 rounded-xl">
      <h3 className="mb-4 font-semibold text-gray-900 text-lg">Envoi en masse</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="bulk-file" className="block mb-2 font-medium text-gray-700 text-sm">
            Importer depuis un fichier CSV
          </label>
          <div className="flex items-center space-x-2">
            <label className="flex items-center hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg transition-colors cursor-pointer">
              <Upload className="mr-2 w-4 h-4" aria-hidden="true" />
              Choisir un fichier
              <input id="bulk-file" type="file" accept=".csv" onChange={onFileChange} className="hidden" />
            </label>
            {bulkMessage.file && (
              <span className="flex items-center text-gray-600 text-sm">
                <CheckCircle className="mr-1 w-4 h-4 text-green-500" />
                {bulkMessage.file.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-500 text-sm">Fichier CSV avec numéros au format +221XXXXXXXXX</p>
        </div>

        {/* On utilise bien le TextareaField comme vous le vouliez */}
        <TextareaField
          label="Destinataires (un numéro par ligne)"
          value={bulkMessage.recipients}
          onChange={onRecipientsChange}
          placeholder={"+221...\n+221...\n+221..."}
          rows={6}
          id="bulk-recipients"
        />

        <div className="flex justify-between text-sm">
          <p className="flex items-center text-gray-500"><User className="mr-1 w-3 h-3" />{recipientCount} destinataires au total</p>
          <p className={`flex items-center ${validRecipientCount === recipientCount ? 'text-green-600' : 'text-orange-600'}`}><CheckCircle className="mr-1 w-3 h-3" />{validRecipientCount} numéros valides</p>
        </div>

        <TextareaField
          label="Message"
          value={bulkMessage.message}
          onChange={onMessageChange}
          placeholder="Votre message..."
          rows={4}
          maxLength={160}
          id="bulk-message"
        />

        {error && (
          <div className="bg-red-50 p-3 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={onSend}
          disabled={!bulkMessage.message.trim() || validRecipientCount === 0 || isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 rounded-lg w-full font-semibold text-white"
        >
          {isLoading ? 'Envoi en cours...' : `Envoyer à ${validRecipientCount} destinataires`}
        </button>
      </div>
    </div>
  );
});

const QuickSendForm: React.FC<{
  quickMessage: { recipient: string; message: string };
  onRecipientChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  isQuickLoading: boolean;
  quickError: string;
}> = React.memo(({
  quickMessage,
  onRecipientChange,
  onMessageChange,
  onSend,
  isQuickLoading,
  quickError
}) => {

  const validatePhoneNumber = (phone: string): boolean => /^\+221\d{9}$/.test(phone.trim());

  return (
    <div className="bg-white shadow-md p-6 rounded-xl">
      <h3 className="flex items-center mb-4 font-semibold text-gray-900 text-lg">
        <MessageCircle className="mr-2 w-5 h-5 text-emerald-600" aria-hidden="true" />
        Envoi rapide
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="quick-recipient" className="block mb-2 font-medium text-gray-700 text-sm">
            Destinataire
          </label>
          <div className="relative">
            <Phone className="top-3 left-3 absolute w-4 h-4 text-gray-400" />
            <input
              id="quick-recipient"
              type="tel"
              value={quickMessage.recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="+221123456789"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors ${
                quickMessage.recipient && !validatePhoneNumber(quickMessage.recipient)
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-emerald-500'
              }`}
            />
          </div>
          {quickMessage.recipient && !validatePhoneNumber(quickMessage.recipient) && (
            <p className="mt-1 text-red-500 text-sm">
              Format requis: +221XXXXXXXXX (Sénégal uniquement)
            </p>
          )}
        </div>

        <TextareaField 
          label="Message"
          value={quickMessage.message}
          onChange={onMessageChange}
          placeholder="Votre message..."
          rows={3}
          maxLength={160}
          id="quick-message"
        />

        {quickError && (
          <div className="bg-red-50 p-3 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="mr-2 w-4 h-4 text-red-500" />
              <p className="text-red-600 text-sm">{quickError}</p>
            </div>
          </div>
        )}

        <button
          onClick={onSend}
          disabled={!quickMessage.recipient.trim() || !quickMessage.message.trim() || !validatePhoneNumber(quickMessage.recipient) || isQuickLoading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 rounded-lg w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
        >
          {isQuickLoading ? (
            <div className="flex justify-center items-center">
              <div className="mr-2 border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin"></div>
              Envoi...
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <Send className="mr-2 w-5 h-5" />
              Envoyer et ouvrir la conversation
            </div>
          )}
        </button>
      </div>
    </div>
  );
});

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalSent: 0,
    totalReceived: 0,
    successRate: 0,
    thisMonth: 0,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickMessage, setQuickMessage] = useState<QuickMessage>({
    recipient: '',
    message: '',
  });
  const [bulkMessage, setBulkMessage] = useState<BulkMessage>({
    recipients: '',
    message: '',
    file: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQuickLoading, setIsQuickLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [quickError, setQuickError] = useState<string>('');
  const [fetchError, setFetchError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'quick' | 'bulk'>('overview');
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  
  const wsInitialized = useRef(false);
  const wsEventHandlers = useRef<{[key: string]: Function}>({});

  // ✅ Initialiser WebSocket pour le dashboard 
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Éviter les initialisations multiples
    if (!token || wsInitialized.current) {
      return;
    }

    wsInitialized.current = true;

    // Configurer les événements AVANT de connecter
    const handleConnected = () => {
      console.log('WebSocket connecté');
      if (!isWebSocketConnected) {
        setIsWebSocketConnected(true);
        notificationService.success('Connexion temps réel active');
      }
    };

    const handleDisconnected = () => {
      console.log('WebSocket déconnecté');
      setIsWebSocketConnected(false);
    };

    const handleConnectionEstablished = (data: any) => {
      console.log('Connexion établie avec le serveur');
      setIsWebSocketConnected(true);
    };

    const handleError = (error: any) => {
      console.error('Erreur WebSocket:', error);
      setIsWebSocketConnected(false);
    };

    const handleMaxReconnectReached = () => {
      console.log('Maximum de reconnexions atteint');
      setIsWebSocketConnected(false);
      notificationService.warning('Connexion temps réel interrompue');
    };

    // Stocker les références des handlers
    wsEventHandlers.current = {
      connected: handleConnected,
      disconnected: handleDisconnected,
      connection_established: handleConnectionEstablished,
      error: handleError,
      max_reconnect_reached: handleMaxReconnectReached
    };

    // Ajouter les événements
    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('connection_established', handleConnectionEstablished);
    wsService.on('error', handleError);
    wsService.on('max_reconnect_reached', handleMaxReconnectReached);

    // Connecter seulement si pas déjà connecté
    if (!wsService.isSocketConnected()) {
      console.log('Initialisation de la connexion WebSocket...');
      wsService.connect(token);
    } else {
      setIsWebSocketConnected(true);
    }

    return () => {
      Object.entries(wsEventHandlers.current).forEach(([event, handler]) => {
        wsService.off(event, handler);
      });
      wsInitialized.current = false;
    };
  }, [isWebSocketConnected]); 

  // Memoized stats calculation
  const calculateStats = useCallback((messages: Message[]): Stats => {
    const sent = messages.filter((msg) => msg.is_sent).length;
    const received = messages.filter((msg) => msg.is_received).length;
    const total = messages.length;
    const thisMonth = messages.filter((msg) => {
      const msgDate = new Date(msg.sent_at);
      const now = new Date();
      return msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalSent: sent,
      totalReceived: received,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      thisMonth,
    };
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const data = await getHistory();
      setMessages(data);
      setStats(calculateStats(data));
    } catch (err: any) {
      setFetchError('Erreur lors du chargement des données. Veuillez réessayer.');
      console.error('Erreur lors du chargement:', err);
      notificationService.error('Erreur lors du chargement des données');
    } finally {
      setFetchLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle quick send
  const handleQuickSend = async () => {
    if (!quickMessage.recipient.trim() || !quickMessage.message.trim()) {
      setQuickError('Veuillez remplir tous les champs.');
      return;
    }

    if (!validatePhoneNumber(quickMessage.recipient)) {
      setQuickError('Numéro de téléphone invalide. Format: +221XXXXXXXXX');
      return;
    }

    setIsQuickLoading(true);
    setQuickError('');

    try {
      const response = await sendSMS({
        recipient: quickMessage.recipient.trim(),
        message: quickMessage.message.trim(),
      });

      const recipient = quickMessage.recipient;
      setQuickMessage({ recipient: '', message: '' });
      await fetchData();

      // Succès avec navigation vers Channels
      notificationService.success('Message envoyé avec succès !');
      
      setTimeout(() => {
        navigate('/channels', {
          state: {
            openConversation: recipient,
            message: 'Message envoyé avec succès !',
          },
        });
      }, 1000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de l\'envoi du message.';
      setQuickError(errorMessage);
      notificationService.error(errorMessage);
    } finally {
      setIsQuickLoading(false);
    }
  };

  // Handle bulk send
  const handleBulkSend = async () => {
    setIsLoading(true);
    setError('');

    const recipients = bulkMessage.recipients
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const validRecipients = recipients.filter(validatePhoneNumber);

    if (validRecipients.length === 0) {
      setError('Veuillez entrer au moins un numéro de téléphone valide.');
      setIsLoading(false);
      return;
    }

    if (!bulkMessage.message.trim()) {
      setError('Veuillez entrer un message.');
      setIsLoading(false);
      return;
    }

    const invalidRecipients = recipients.filter(num => !validatePhoneNumber(num));
    if (invalidRecipients.length > 0) {
      setError(`Numéros invalides: ${invalidRecipients.join(', ')}`);
      setIsLoading(false);
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const recipient of validRecipients) {
        try {
          await sendSMS({
            recipient,
            message: bulkMessage.message.trim(),
          });
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Erreur envoi vers ${recipient}:`, err);
        }
      }

      setBulkMessage({ recipients: '', message: '', file: null });
      await fetchData();
      
      if (errorCount === 0) {
        notificationService.success(`${successCount} messages envoyés avec succès !`);
        setActiveTab('overview');
      } else {
        notificationService.warning(`${successCount} envoyés, ${errorCount} échecs`);
      }

    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi en masse.');
      notificationService.error('Erreur lors de l\'envoi en masse');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const phoneNumbers = lines
          .map((line) => {
            // Prendre la première colonne (avant la virgule)
            const phone = line.split(',')[0].trim();
            // Nettoyer le numéro
            return phone.replace(/['"]/g, '').trim();
          })
          .filter((phone) => phone && validatePhoneNumber(phone));

        if (phoneNumbers.length === 0) {
          setError('Aucun numéro valide trouvé dans le fichier CSV.');
          return;
        }

        setBulkMessage((prev) => ({
          ...prev,
          recipients: phoneNumbers.join('\n'),
          file,
        }));

        notificationService.success(`${phoneNumbers.length} numéros importés du CSV`);
      };
      reader.readAsText(file);
    } else {
      setError('Veuillez sélectionner un fichier CSV valide.');
    }
  };

  // ✅ Fonction pour reconnecter manuellement le WebSocket
  const handleReconnectWebSocket = () => {
    const token = localStorage.getItem('token');
    if (token) {
      wsService.resetReconnectAttempts();
      wsService.connect(token);
      notificationService.info('Tentative de reconnexion...');
    }
  };

  // StatCard component
  const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white shadow-md hover:shadow-lg p-6 rounded-xl transition-shadow" role="region" aria-label={title}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-gray-600 text-sm">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="mt-1 text-gray-500 text-xs">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  // RecentMessages component
  const RecentMessages: React.FC = () => (
    <div className="bg-white shadow-md p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">Messages récents</h3>
        <div className="flex items-center space-x-2">
          {isWebSocketConnected ? (
            <span className="flex items-center text-green-600 text-sm">
              <Wifi className="mr-1 w-4 h-4" />
              En ligne
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-gray-500 text-sm">
                <WifiOff className="mr-1 w-4 h-4" />
                Hors ligne
              </span>
              <button
                onClick={handleReconnectWebSocket}
                className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm underline"
                title="Reconnecter"
              >
                <RefreshCw className="mr-1 w-3 h-3" />
                Reconnecter
              </button>
            </div>
          )}
        </div>
      </div>
      
      {fetchLoading ? (
        <div className="py-8 text-center">
          <div className="mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full w-8 h-8 animate-spin"></div>
          <p className="mt-2 text-gray-500">Chargement...</p>
        </div>
      ) : fetchError ? (
        <div className="py-4 text-center">
          <div className="flex justify-center items-center mb-2">
            <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
            <p className="text-red-500">{fetchError}</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center mx-auto mt-2 text-emerald-600 hover:text-emerald-700 text-sm underline"
          >
            <RefreshCw className="mr-1 w-3 h-3" />
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {messages.slice(0, 8).map((message) => (
            <div
              key={message.id}
              className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors"
              role="listitem"
            >
              <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">À : {message.recipient_phone}</p>                <p className="text-gray-600 text-sm truncate">{message.message}</p>
                <p className="text-gray-500 text-xs">
                  <Clock className="inline mr-1 w-3 h-3" />
                  {new Date(message.sent_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                {message.is_sent ? (
                  <CheckCircle className="w-5 h-5 text-green-500" aria-label="Message envoyé" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" aria-label="Message non envoyé" />
                )}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="py-8 text-gray-500 text-center">
              <MessageSquare className="mx-auto mb-2 w-12 h-12 text-gray-300" />
              <p>Aucun message pour l'instant</p>
              <p className="text-sm">Envoyez votre premier SMS !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );



  

  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="font-bold text-gray-900 text-3xl">Tableau de bord</h1>
          <p className="mt-2 text-gray-600">Vue d'ensemble de votre plateforme SMS</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-gray-200 border-b">
          <nav className="flex space-x-8 -mb-px" role="tablist">
            {(['overview', 'quick', 'bulk'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
              >
                {tab === 'overview' ? "Vue d'ensemble" : tab === 'quick' ? 'Envoi rapide' : 'Envoi en masse'}
              </button>
            ))}
          </nav>
        </div>

        <div role="tabpanel" id={`${activeTab}-panel`}>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={Send}
                  title="Messages envoyés"
                  value={stats.totalSent}
                  subtitle="Total"
                  color="emerald"
                />
                <StatCard
                  icon={MessageSquare}
                  title="Messages reçus"
                  value={stats.totalReceived}
                  subtitle="Total"
                  color="blue"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Taux de succès"
                  value={`${stats.successRate}%`}
                  subtitle="Livraison"
                  color="green"
                />
                <StatCard
                  icon={Calendar}
                  title="Ce mois"
                  value={stats.thisMonth}
                  subtitle="Messages"
                  color="purple"
                />
              </div>
              <RecentMessages />
            </div>
          )}

{activeTab === 'quick' && (
  <div className="mx-auto max-w-2xl">
    <QuickSendForm
      quickMessage={quickMessage}
      onRecipientChange={(value) => setQuickMessage((prev) => ({ ...prev, recipient: value }))}
      onMessageChange={(value) => setQuickMessage((prev) => ({ ...prev, message: value }))}
      onSend={handleQuickSend}
      isQuickLoading={isQuickLoading}
      quickError={quickError}
    />
  </div>
)}

{activeTab === 'bulk' && (
  <div className="mx-auto max-w-2xl">
    <BulkSendForm
      bulkMessage={bulkMessage}
      onRecipientsChange={(value) => setBulkMessage((prev) => ({ ...prev, recipients: value }))}
      onMessageChange={(value) => setBulkMessage((prev) => ({ ...prev, message: value }))}
      onFileChange={handleFileUpload}
      onSend={handleBulkSend}
      isLoading={isLoading}
      error={error}
    />
  </div>
)}
</div>
</div>
</div>
);
};

export default Dashboard;