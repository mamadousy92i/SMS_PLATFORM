
class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 2; //  Réduire les tentatives de reconnexion
        this.reconnectDelay = 2000; //  Augmenter le délai entre reconnexions
        this.listeners = new Map();
        this.isConnected = false;
        this.pingInterval = null;
        this.token = null;
        this.connectionAttempting = false; //  Éviter les connexions simultanées
    }

    connect(token) {
        //  Éviter les connexions multiples simultanées
        if (this.connectionAttempting) {
            console.log('Connexion déjà en cours...');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket déjà connecté');
            return;
        }

        this.connectionAttempting = true;
        this.token = token;

        try {
            const wsUrl = `ws://localhost:8000/ws/sms/?token=${encodeURIComponent(token)}`;
            console.log('Connexion WebSocket vers:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = (event) => {
                console.log('WebSocket connecté avec succès');
                this.isConnected = true;
                this.connectionAttempting = false;
                this.reconnectAttempts = 0;
                this.startPingInterval();
                this.emit('connected', event);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    //  Log seulement les messages importants
                    if (data.type !== 'pong') {
                        console.log('Message WebSocket reçu:', data.type);
                    }
                    
                    // Émettre l'événement selon le type
                    if (data.type) {
                        this.emit(data.type, data);
                    }
                    this.emit('message', data);
                } catch (error) {
                    console.error('Erreur parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket fermé:', event.code, event.reason);
                this.isConnected = false;
                this.connectionAttempting = false; //  Reset flag
                this.stopPingInterval();
                this.emit('disconnected', event);
                
                //  Reconnexion automatique plus intelligente
                if (event.code !== 1000 && event.code !== 4001) { // Pas pour déconnexion volontaire ou auth
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Backoff exponentiel
                        setTimeout(() => {
                            this.reconnectAttempts++;
                            console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                            this.connect(this.token);
                        }, delay);
                    } else {
                        console.log('Maximum de tentatives de reconnexion atteint');
                        this.emit('max_reconnect_reached');
                    }
                }
            };

            this.ws.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                this.connectionAttempting = false; // Reset flag en cas d'erreur
                this.emit('error', error);
            };

        } catch (error) {
            console.error('Erreur lors de la connexion WebSocket:', error);
            this.connectionAttempting = false; //  Reset flag
        }
    }

    disconnect() {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; //  Empêcher la reconnexion auto
            this.ws.close(1000, 'Déconnexion volontaire');
            this.ws = null;
            this.isConnected = false;
            this.connectionAttempting = false;
            this.stopPingInterval();
        }
    }

    // Envoyer un message
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket non connecté, impossible d\'envoyer le message');
            return false;
        }
    }

    //  Ping moins fréquent pour réduire le trafic
    ping() {
        if (this.isConnected) {
            this.send({
                type: 'ping',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Marquer une conversation comme lue
    markAsRead(conversationId) {
        return this.send({
            type: 'mark_as_read',
            conversation_id: conversationId
        });
    }

    // Système d'événements
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erreur dans le callback WebSocket pour ${event}:`, error);
                }
            });
        }
    }

    // Ping toutes les 45 secondes au lieu de 30
    startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            this.ping();
        }, 45000);
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // Méthodes utilitaires
    getConnectionState() {
        if (!this.ws) return 'CLOSED';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    isSocketConnected() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    //  Méthode pour reset les tentatives de reconnexion
    resetReconnectAttempts() {
        this.reconnectAttempts = 0;
    }
}

// Instance singleton
const wsService = new WebSocketService();

export default wsService;