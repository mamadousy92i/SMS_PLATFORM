import axios from 'axios';

/**
 * Rafraîchit le token d'authentification
 * @returns {Promise<string>} Le nouveau token d'accès
 */
export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) {
      throw new Error('Aucun refresh token trouvé');
    }

    const response = await axios.post('http://localhost:8000/api/token/refresh/', {
      refresh: refresh
    });

    const { access } = response.data;
    return access;
  } catch (error) {
    // En cas d'erreur, on déconnecte l'utilisateur
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean} true si l'utilisateur est authentifié, false sinon
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
