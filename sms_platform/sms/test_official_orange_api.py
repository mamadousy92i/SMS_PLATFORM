# test_official_orange_api.py - Test selon documentation officielle

import requests
import base64
import urllib.parse
import json

def test_official_orange_api():
    """Test selon la documentation officielle Orange"""
    
    # Vos identifiants
    client_id = "AKzbut7l2cRnGO4pdfKlAO7J5gGFK46r"
    client_secret = "cVOgY1BeJGs1wOZlWTerCp68fpM7p4p0MrrLfIv2WAYT"
    
    print("🔍 TEST SELON DOCUMENTATION OFFICIELLE ORANGE")
    print("=" * 60)
    
    # Étape 1: Test OAuth
    print("\n1️⃣ TEST OAUTH")
    print("-" * 30)
    
    # URLs OAuth à tester (HTTPS et HTTP)
    oauth_urls = [
        "https://api.orange.com/oauth/v3/token",
        "http://api.orange.com/oauth/v3/token",
        "https://api.orange.com/oauth/v2/token",
        "http://api.orange.com/oauth/v2/token"
    ]
    
    access_token = None
    
    for oauth_url in oauth_urls:
        print(f"\nTest: {oauth_url}")
        
        try:
            # Basic Auth selon standard OAuth
            auth_string = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': f'Basic {auth_string}'
            }
            
            data = {"grant_type": "client_credentials"}
            
            # Désactiver SSL pour HTTP
            verify_ssl = oauth_url.startswith('https')
            
            response = requests.post(
                oauth_url,
                data=data,
                headers=headers,
                timeout=20,
                verify=verify_ssl
            )
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                print(f"  ✅ Token obtenu: {access_token[:20]}...")
                print(f"  Expires in: {token_data.get('expires_in')} secondes")
                break
            else:
                print(f"  ❌ Erreur: {response.text}")
                
        except Exception as e:
            print(f"  💥 Exception: {e}")
    
    if not access_token:
        print("\n❌ ÉCHEC: Impossible d'obtenir un token OAuth")
        return
    
    # Étape 2: Test SMS selon la documentation
    print(f"\n2️⃣ TEST SMS (Documentation officielle)")
    print("-" * 40)
    
    sender_number = "221780189981"
    recipient_number = "221780189981"  # Même numéro pour test
    
    # Encoder le sender selon la documentation: tel:+221780189981 → tel%3A%2B221780189981
    tel_format = f"tel:+{sender_number}"
    encoded_sender = urllib.parse.quote(tel_format, safe='')
    
    print(f"Sender original: +{sender_number}")
    print(f"Format tel: {tel_format}")
    print(f"URL encoded: {encoded_sender}")
    
    # URLs SMS selon la documentation
    sms_urls = [
        f"https://api.orange.com/smsmessaging/v1/outbound/{encoded_sender}/requests",
        f"http://api.orange.com/smsmessaging/v1/outbound/{encoded_sender}/requests"
    ]
    
    # Payload EXACT selon la documentation
    payload = {
        "outboundSMSMessageRequest": {
            "address": f"tel:+{recipient_number}",
            "senderAddress": f"tel:+{sender_number}",
            "outboundSMSTextMessage": {
                "message": "Test selon documentation officielle Orange! 🚀"
            }
        }
    }
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    print(f"\nPayload: {json.dumps(payload, indent=2)}")
    
    for sms_url in sms_urls:
        print(f"\nTest SMS: {sms_url}")
        
        try:
            verify_ssl = sms_url.startswith('https')
            
            response = requests.post(
                sms_url,
                json=payload,
                headers=headers,
                timeout=30,
                verify=verify_ssl
            )
            
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.text}")
            
            if response.status_code == 201:  # Created selon la doc
                result = response.json()
                print("  ✅ SMS ENVOYÉ AVEC SUCCÈS!")
                
                # Analyser la réponse selon la structure Orange
                sms_request = result.get('outboundSMSMessageRequest', {})
                resource_url = sms_request.get('resourceURL')
                sender_name = sms_request.get('senderName')
                
                print(f"  Resource URL: {resource_url}")
                print(f"  Sender Name: {sender_name}")
                
                # Extraire l'ID du message si possible
                if resource_url:
                    try:
                        message_id = resource_url.split('/')[-1]
                        print(f"  Message ID: {message_id}")
                    except:
                        pass
                
                return result
            
            elif response.status_code == 400:
                print("  ❌ Erreur 400 - Problème dans la requête")
                try:
                    error_data = response.json()
                    print(f"  Détail erreur: {error_data}")
                except:
                    pass
            
            elif response.status_code == 403:
                print("  ❌ Erreur 403 - Problème d'autorisation")
                try:
                    error_data = response.json()
                    print(f"  Détail erreur: {error_data}")
                except:
                    pass
            
            else:
                print(f"  ❌ Erreur {response.status_code}")
                
        except Exception as e:
            print(f"  💥 Exception: {e}")
    
    # Étape 3: Test des endpoints Admin (selon la doc)
    print(f"\n3️⃣ TEST ENDPOINTS ADMIN")
    print("-" * 40)
    
    admin_endpoints = [
        "https://api.orange.com/sms/admin/v1/contracts",
        "http://api.orange.com/sms/admin/v1/contracts",
        "https://api.orange.com/sms/admin/v1/statistics",
        "http://api.orange.com/sms/admin/v1/statistics"
    ]
    
    admin_headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    for endpoint in admin_endpoints:
        print(f"\nTest: {endpoint}")
        
        try:
            verify_ssl = endpoint.startswith('https')
            
            response = requests.get(
                endpoint,
                headers=admin_headers,
                timeout=20,
                verify=verify_ssl
            )
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"  ✅ Données reçues: {len(str(data))} caractères")
                    
                    # Afficher un aperçu des contrats ou statistiques
                    if 'contracts' in endpoint:
                        print("  📋 Contrats récupérés")
                    elif 'statistics' in endpoint:
                        print("  📊 Statistiques récupérées")
                    
                except:
                    print(f"  ✅ Réponse reçue: {response.text[:100]}...")
            else:
                print(f"  ❌ Erreur: {response.text}")
                
        except Exception as e:
            print(f"  💥 Exception: {e}")
    
    print(f"\n" + "=" * 60)
    print("🎯 RÉSUMÉ DU TEST")
    print("=" * 60)
    
    if access_token:
        print("✅ OAuth: SUCCÈS")
        print("📱 SMS: Testez les résultats ci-dessus")
        print("🔧 Admin: Endpoints testés")
        print("\n💡 Si le SMS fonctionne, votre intégration est opérationnelle!")
    else:
        print("❌ OAuth: ÉCHEC")
        print("📞 Contactez le support Orange Developer")

if __name__ == "__main__":
    test_official_orange_api()