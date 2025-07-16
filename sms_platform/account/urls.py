# account/urls.py - Version complète avec toutes les routes
from django.urls import path
from .views import RegisterView, ProfileView, ChangePasswordView

urlpatterns = [
    # ✅ Endpoint d'inscription - Accès public
    path('register/', RegisterView.as_view(), name='register'),
    
    # ✅ Endpoint de profil utilisateur - Authentification requise
    path('profile/', ProfileView.as_view(), name='profile'),
    
    # ✅ Endpoint de changement de mot de passe - Authentification requise
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]