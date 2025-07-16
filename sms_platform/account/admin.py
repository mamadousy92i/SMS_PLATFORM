from django.contrib import admin

# Register your models here.
from .models import CustomUser, OAuthToken

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'nom', 'prenom', 'email', 'telephone', 'is_active', 'is_staff')
    search_fields = ('username', 'nom', 'prenom', 'email', 'telephone')
    list_filter = ('is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'nom', 'prenom', 'telephone','password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

@admin.register(OAuthToken)
class OAuthTokenAdmin(admin.ModelAdmin):
    list_display = ('access_token', 'expires_in', 'created_at')
    search_fields = ('access_token',)
    list_filter = ('created_at',)
    readonly_fields = ('access_token', 'refresh_token', 'expires_in', 'created_at')