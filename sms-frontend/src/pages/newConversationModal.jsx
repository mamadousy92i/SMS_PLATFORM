import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createConversation } from '../utils/api';

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
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhone = (phone) => {
    return phone.startsWith('+') && phone.length >= 10;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && validatePhone(formData.contact_phone)) {
      handleSubmit();
    }
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
              onKeyPress={handleKeyPress}
              placeholder="+221123456789"
              className="px-3 py-2 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              required
              autoFocus
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
              onKeyPress={handleKeyPress}
              placeholder="Nom du contact"
              className="px-3 py-2 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
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
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors disabled:cursor-not-allowed"
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

export default NewConversationModal;