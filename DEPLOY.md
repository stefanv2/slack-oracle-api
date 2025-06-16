## 📦 Deploy.md - Slack Oracle Bot Deployment Handleiding

In dit document leggen we uit hoe je de Slack Oracle Bot correct kunt deployen in een productie- of testomgeving.

### 🛠️ Benodigdheden

- Oracle Database met toegang tot tabel `POSTCODE`
- Slack App met geconfigureerde slash commands
- Docker geïnstalleerd op je server
- Ngrok of andere tunneling-service

---

### 🐳 Docker Build en Start

```bash
# Clone de repository
git clone https://github.com/stefanv2/slack-oracle-api.git
cd slack-oracle-api

# .env aanmaken met database- en poortconfiguratie
nano .env

DB_USER=postman
DB_PASSWORD=je_wachtwoord
DB_CONNECTSTRING=192.168.2.114:1521/luiz
PORT=3001
GOOGLE_MAPS_API_KEY=je_maps_api_key (optioneel)

# Build de Docker image
sudo docker build -t slack-oracle-api .

# Start de container op poort 3001 (grafiekbot)
sudo docker run -d --name slack-grafiekbot -p 3001:3001 --env-file .env slack-oracle-api


### 🌍 Ngrok Configuratie

```
# ~/.ngrok2/ngrok.yml
version: 2
authtoken: jouw_ngrok_authtoken
tunnels:
  postcode:
    proto: http
    addr: 3000
  grafiek:
    proto: http
    addr: 3001

ngrok start --all --config ~/.ngrok2/ngrok.yml


🚀 Slack Slash Commands Instellen
Ga naar je Slack App instellingen en voeg slash commands toe:

Commando	Request URL
/postcode	https://<ngrok-url>/postcode
/grafiek	https://<ngrok-url>/slack/grafiek
/quote	https://<ngrok-url>/slack/quote

Zorg ervoor dat de content type is: application/x-www-form-urlencoded


📈 Testing

# Test lokaal
curl -X POST http://localhost:3001/slack/quote


