"""
Django settings for sms_platform project.
Version corrigée avec permissions adaptées
"""

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Charger le fichier .env
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Application definition
INSTALLED_APPS = [
    'daphne',  # ✅ Ajouté pour ASGI/WebSocket
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'account',
    'sms',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ✅ En premier pour CORS
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'sms_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ✅ Configuration ASGI pour WebSocket
WSGI_APPLICATION = 'sms_platform.wsgi.application'
ASGI_APPLICATION = 'sms_platform.asgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'  # ✅ Timezone Sénégal
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ✅ Modèle utilisateur personnalisé
AUTH_USER_MODEL = 'account.CustomUser'

# ✅ Configuration Django REST Framework CORRIGÉE
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # ✅ MODIFICATION: Permissions par défaut plus flexibles
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',  # Permet l'accès public aux endpoints publics
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# ✅ Configuration JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'account.serializers.CustomTokenObtainPairSerializer',
}

# ✅ Configuration CORS pour React - PLUS PERMISSIVE
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

CORS_ALLOW_CREDENTIALS = True

# ✅ En développement, autoriser toutes les origins
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
    
    # Headers autorisés pour le développement
    CORS_ALLOW_HEADERS = [
        'accept',
        'accept-encoding',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'x-csrftoken',
        'x-requested-with',
    ]
    
    # Méthodes autorisées
    CORS_ALLOW_METHODS = [
        'DELETE',
        'GET',
        'OPTIONS',
        'PATCH',
        'POST',
        'PUT',
    ]

# ✅ Configuration des WebSockets (Django Channels)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
        # Pour la production, utilisez Redis:
        # 'BACKEND': 'channels_redis.core.RedisChannelLayer',
        # 'CONFIG': {
        #     "hosts": [('127.0.0.1', 6379)],
        # },
    },
}

# ✅ Configuration du logging AMÉLIORÉE
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'colored': {
            'format': '🔥 {levelname} {asctime} - {name} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'sms_app.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'colored',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'account.views': {  # ✅ Logger pour vos vues d'account
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'account.services': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'sms.views': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'sms.consumers': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'sms.services': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.channels': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {  # ✅ Pour logger les erreurs 401, 500, etc.
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ✅ Configuration API Orange SMS
ORANGE_SMS_CONFIG = {
    'CLIENT_ID': os.getenv('ORANGE_CLIENT_ID'),
    'CLIENT_SECRET': os.getenv('ORANGE_CLIENT_SECRET'),
    'BASE_URL': os.getenv('ORANGE_BASE_URL', 'https://api.orange.com'),
    'SENDER_PHONE': os.getenv('ORANGE_SENDER_PHONE'),
    'DEFAULT_SENDER_NAME': 'SMS215858',
}

# ✅ Configuration Email (optionnel pour notifications)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Pour dev
if not DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# ✅ Configuration cache (optionnel)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# ✅ Configuration sessions
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 semaines
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG

# ✅ Configuration CSRF - PLUS PERMISSIVE
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# ✅ En développement, désactiver certaines vérifications CSRF
if DEBUG:
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_SAMESITE = 'Lax'

# ✅ Configuration des fichiers média (si nécessaire)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ✅ Configuration de développement spéciale
if DEBUG:
    # Désactiver les migrations pour les tests plus rapides
    import sys
    if 'test' in sys.argv:
        DATABASES['default'] = {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:'
        }
    
    # Toolbar de debug Django (optionnel)
    try:
        import debug_toolbar
        INSTALLED_APPS.append('debug_toolbar')
        MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
    except ImportError:
        pass

# ✅ Variables d'environnement pour Orange API
ORANGE_CLIENT_ID = os.getenv('ORANGE_CLIENT_ID')
ORANGE_CLIENT_SECRET = os.getenv('ORANGE_CLIENT_SECRET')
ORANGE_BASE_URL = os.getenv('ORANGE_BASE_URL', 'https://api.orange.com')
ORANGE_SENDER_PHONE = os.getenv('ORANGE_SENDER_PHONE')

# ✅ Validation des variables d'environnement critiques
required_env_vars = [
    'SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'ORANGE_CLIENT_ID', 'ORANGE_CLIENT_SECRET', 'ORANGE_SENDER_PHONE'
]

missing_vars = []
for var in required_env_vars:
    if not os.getenv(var):
        missing_vars.append(var)

if missing_vars:
    print(f"⚠️  Variables d'environnement manquantes: {', '.join(missing_vars)}")
    print("L'application peut ne pas fonctionner correctement.")
else:
    print("✅ Configuration Django chargée avec succès")
    print(f"🗄️  Base de données: {DATABASES['default']['NAME']}")
    print(f"📱 Numéro Orange: {ORANGE_SENDER_PHONE}")
    print(f"🔌 WebSocket: {ASGI_APPLICATION}")
    print(f"🌐 CORS autorisé: {CORS_ALLOWED_ORIGINS}")
    print(f"🔐 Debug mode: {DEBUG}")
    if DEBUG:
        print("🔓 Toutes les origins CORS autorisées en mode debug")