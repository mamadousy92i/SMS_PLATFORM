// src/utils/notifications.js - Service de notifications

class NotificationService {
    constructor() {
      this.permission = 'default';
      this.toastContainer = null;
      this.initPermission();
      this.createToastContainer();
    }
  
    async initPermission() {
      if ('Notification' in window) {
        this.permission = await Notification.requestPermission();
      }
    }
  
    // Créer le conteneur pour les toasts
    createToastContainer() {
      if (!this.toastContainer) {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          pointer-events: none;
        `;
        document.body.appendChild(this.toastContainer);
      }
    }
  
    // Notification browser native
    showBrowserNotification(title, options = {}) {
      if (this.permission === 'granted' && 'Notification' in window) {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
  
        // Auto-fermeture après 5 secondes
        setTimeout(() => notification.close(), 5000);
  
        return notification;
      }
    }
  
    // Notification pour nouveau message SMS
    notifyNewMessage(message) {
      const title = `📱 Nouveau SMS de ${message.sender_phone}`;
      const options = {
        body: message.message,
        icon: '/favicon.ico',
        tag: `sms-${message.id}`, // Évite les doublons
        requireInteraction: false,
      };
  
      return this.showBrowserNotification(title, options);
    }
  
    // Notification pour statut de livraison
    notifyDeliveryStatus(messageId, status) {
      let title, body;
      
      switch (status) {
        case 'delivered':
          title = '✅ Message livré';
          body = 'Votre SMS a été livré avec succès';
          break;
        case 'failed':
          title = '❌ Échec de livraison';
          body = 'Votre SMS n\'a pas pu être livré';
          break;
        default:
          return;
      }
  
      return this.showBrowserNotification(title, { body });
    }
  
    // Notification in-app (toast)
    showToast(message, type = 'info', duration = 4000) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        background: ${this.getToastColor(type)};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
        max-width: 350px;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
      `;
      
      toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>${this.getToastIcon(type)} ${message}</span>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
        </div>
      `;
  
      this.toastContainer.appendChild(toast);
  
      // Animation d'entrée
      setTimeout(() => {
        toast.style.transform = 'translateX(0)';
      }, 10);
  
      // Auto-suppression
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, duration);
  
      return toast;
    }
  
    getToastColor(type) {
      const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
      };
      return colors[type] || colors.info;
    }
  
    getToastIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || icons.info;
    }
  
    // Toast spécialisés
    success(message, duration) {
      return this.showToast(message, 'success', duration);
    }
  
    error(message, duration) {
      return this.showToast(message, 'error', duration);
    }
  
    warning(message, duration) {
      return this.showToast(message, 'warning', duration);
    }
  
    info(message, duration) {
      return this.showToast(message, 'info', duration);
    }
  
    // Toast pour nouveau message
    newMessageToast(message) {
      return this.showToast(
        `Nouveau SMS de ${message.sender_phone}: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
        'info',
        5000
      );
    }
  }
  
  // Instance singleton
  const notificationService = new NotificationService();
  
  export default notificationService;