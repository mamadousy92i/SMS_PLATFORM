from rest_framework import serializers
from .models import CustomUser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajoute des informations supplémentaires au token
        token['username'] = user.username
        token['nom'] = user.nom
        token['prenom'] = user.prenom
        token['email'] = user.email
        token['telephone'] = user.telephone
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Ajoute des informations utilisateur à la réponse
        data['user'] = {
            'username': self.user.username,
            'nom': self.user.nom,
            'prenom': self.user.prenom,
            'email': self.user.email,
            'telephone': self.user.telephone
        }
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirmPassword = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('nom', 'prenom', 'username', 'email', 'telephone', 'password', 'confirmPassword')

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirmPassword')
        user = CustomUser.objects.create_user(
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            username=validated_data['username'],
            email=validated_data['email'],
            telephone=validated_data['telephone'],
            password=validated_data['password']
        )
        return user