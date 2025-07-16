# account/models.py - Modèle OAuthToken corrigé

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, nom, prenom, telephone, password=None, **extra_fields):
        if not username:
            raise ValueError("Le nom d'utilisateur est requis.")
        if not email:
            raise ValueError("L'email est requis.")
        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            nom=nom,
            prenom=prenom,
            telephone=telephone,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, nom, prenom, telephone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, nom, prenom, telephone, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, unique=True, blank=False, null=False)   
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nom', 'prenom', 'telephone']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.username})"

class OAuthToken(models.Model):
    # CORRIGÉ: Augmentation de la taille des champs token
    access_token = models.TextField()  # TextField au lieu de CharField(500)
    refresh_token = models.TextField(null=True, blank=True)  # TextField aussi
    expires_in = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Token créé le {self.created_at}"
    
    def is_valid(self):
        """Vérifie si le token est encore valide"""
        return self.expires_in > timezone.now()
    
    @classmethod
    def get_valid_token(cls):
        """Récupère un token valide ou None"""
        try:
            return cls.objects.filter(
                expires_in__gt=timezone.now()
            ).latest('created_at')
        except cls.DoesNotExist:
            return None