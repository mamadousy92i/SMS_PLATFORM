# account/views.py - Version complète corrigée
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer
import logging

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    """Inscription des nouveaux utilisateurs - Accès public"""
    permission_classes = [AllowAny]  # ✅ Permettre l'accès sans authentification
    
    def post(self, request):
        try:
            logger.info(f"Tentative d'inscription avec les données: {request.data}")
            
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"✅ Utilisateur créé avec succès: {user.username}")
                
                return Response(
                    {
                        "message": "Utilisateur créé avec succès",
                        "user": {
                            "username": user.username,
                            "nom": user.nom,
                            "prenom": user.prenom,
                            "email": user.email
                        }
                    }, 
                    status=status.HTTP_201_CREATED
                )
            else:
                logger.warning(f"❌ Erreurs de validation: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'inscription: {str(e)}")
            return Response(
                {"error": "Erreur interne du serveur"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProfileView(APIView):
    """Profil utilisateur - Authentification requise"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Récupérer le profil de l'utilisateur connecté"""
        try:
            user = request.user
            return Response({
                'id': user.id,
                'username': user.username,
                'nom': user.nom,
                'prenom': user.prenom,
                'email': user.email,
                'telephone': user.telephone,
                'is_active': user.is_active,
                'date_joined': user.date_joined
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération profil: {str(e)}")
            return Response(
                {"error": "Erreur lors de la récupération du profil"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Mettre à jour le profil utilisateur"""
        try:
            user = request.user
            data = request.data
            
            # Mettre à jour les champs autorisés
            if 'nom' in data:
                user.nom = data['nom']
            if 'prenom' in data:
                user.prenom = data['prenom']
            if 'email' in data:
                user.email = data['email']
            if 'telephone' in data:
                user.telephone = data['telephone']
            
            user.save()
            
            logger.info(f"✅ Profil mis à jour pour: {user.username}")
            
            return Response({
                'message': 'Profil mis à jour avec succès',
                'user': {
                    'username': user.username,
                    'nom': user.nom,
                    'prenom': user.prenom,
                    'email': user.email,
                    'telephone': user.telephone
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour profil: {str(e)}")
            return Response(
                {"error": "Erreur lors de la mise à jour"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChangePasswordView(APIView):
    """Changer le mot de passe utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            old_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            
            if not old_password or not new_password:
                return Response(
                    {"error": "Ancien et nouveau mot de passe requis"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier l'ancien mot de passe
            if not user.check_password(old_password):
                return Response(
                    {"error": "Ancien mot de passe incorrect"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Changer le mot de passe
            user.set_password(new_password)
            user.save()
            
            logger.info(f"✅ Mot de passe changé pour: {user.username}")
            
            return Response(
                {"message": "Mot de passe changé avec succès"}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"❌ Erreur changement mot de passe: {str(e)}")
            return Response(
                {"error": "Erreur lors du changement de mot de passe"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )