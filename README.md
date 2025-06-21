# 🔗 Slack Oracle API

Een eenvoudige Node.js API in Docker die postcodegegevens uit een Oracle-database ophaalt, ontworpen voor gebruik met een Slack slash command zoals `/postcode`.

---

<p align="center">
<img src="docs/Slack-RGB.png" alt="BTOP" width="120" height="120"/>  
</p>

---


## 🚀 Features

- ✅ Zoekt straat- en plaatsnamen op uit een Oracle-database
- ✅ Reageert binnen Slack op het slash-commando `/postcode`
- ✅ Toont resultaten in een fraai oranje Slack-blok
- ✅ Ondersteuning voor een statische Google Maps afbeelding (optioneel)
- ✅ Draait volledig in een Docker-container

---

## ⚙️ Voorwaarden

- Oracle-database met een tabel `POSTCODE_TABLE` die adresgegevens bevat
- Werkende tunnel of netwerkverbinding tussen je API-server en Oracle
- Slack-account + Slack App
- (Optioneel) Google Maps Static API key

---

## 🐳 Installatie via Docker

1. **Clone deze repo:**

   ```bash
   git clone https://github.com/stefanv2/slack-oracle-api.git
   cd slack-oracle-api

2. Maak een .env bestand aan:
nano .env

DB_USER=postman
DB_PASSWORD=xxxxxx
DB_CONNECTSTRING=192.168.2.114:1521/luiz
PORT=3000
GOOGLE_MAPS_API_KEY=je_google_maps_api_key

3. Bouw de Docker-container:

docker build -t slack-oracle-api .

4. Start de container:

docker run -d \
  -p 3000:3000 \
  --name slack-oracle-api \
  --env-file .env \
  slack-oracle-api

🧪 Test lokaal

curl -X POST http://localhost:3000/postcode -d "text=1234AB"

🌍 Slack Slash Command instellen

Ga naar Slack API Dashboard

Kies je app of maak een nieuwe aan

Onder Slash Commands, voeg toe:

    Command: /postcode

    Request URL: https://<jouw-ngrok-subdomein>.ngrok-free.app/postcode

    Method: POST

    Content type: application/x-www-form-urlencoded


5. Start ngrok lokaal:

ngrok http 3000

💻 Development Tips

node_modules/
.env

🔧 Troubleshooting

    Timeouts in Slack?
    → Controleer je ngrok, poorten en logs met docker logs slack-oracle-api

    Databasefout?
    → Controleer connectiegegevens, netwerk, tunnel of firewall

    502 of geen antwoord?
    → Controleer of Docker-container draait en luistert op poort 3000

👨‍💻 Auteur

Gemaakt door Stefan Voorbij
Repo: slack-oracle-api

















