# 📦 Slack Adresbot (Fuse.js)

Deze module voegt fuzzy search toe aan jouw Slack Oracle API, waarmee je op straatnaam en plaats fuzzy kunt zoeken via een Slack slash command, zoals:


Je krijgt dan als resultaat het juiste adres met postcode en locatie inclusief een Google Maps afbeelding. Supersnel en zonder dat de database telkens wordt bevraagd!

---

## ⚙️ Structuur

```plaintext
slack-oracle-api/
├── adresbot/
│ ├── fuseHelper.js # Laadt de JSON-data in een Fuse.js index
│ ├── generate-fuse-json.js # Eenmalig script om data uit Oracle op te halen en weg te schrijven naar fuse-data.json
│ ├── fuse-data.json # JSON-bestand met straat, plaats en postcode (eventueel ook geo-coördinaten)
│ ├── slack-adres.js # Slack router die /adres commando afhandelt (fuzzy + async + Google Maps)
│ └── index-adres.js # Start je Express server met Fuse.js integratie

```

---

## 🚀 Installatie en gebruik

### 1. Genereer de JSON-index
Deze stap haalt data uit de Oracle database en schrijft `fuse-data.json` weg. Deze wordt daarna gebruikt in je Slackbot.

```bash
node tools/generate-fuse-json.js

DB_USER=postman
DB_PASSWORD=*****
DB_CONNECTSTRING=192.168.2.114/luiz

sudo docker build -t slack-adresbot .
sudo docker run -d -p 3002:3002 --name slack-adresbot --env-file .env.adres slack-adresbot

🔍 Werking
🔹 De Slackbot ontvangt een Slack /adres commando.

🔹 Het zoekt in fuse-data.json naar het beste fuzzy match (bijv. "oktoberstr almere").

🔹 Daarna wordt (optioneel) een extra query op de Oracle DB uitgevoerd voor de coördinaten.

🔹 Een afbeelding van Google Maps wordt gegenereerd met de coördinaten.

🔹 Je krijgt een Slack-blokje terug met 📍 adresinfo.

🧠 Tips
Je kunt het script generate-fuse-json.js periodiek draaien via cron of handmatig na updates in de database.

Fuse.js zoekt alleen in de JSON – geen Oracle-queries tenzij nodig.

Je kunt extra velden toevoegen aan fuse-data.json, zoals lengtegraad en breedtegraad.


📎 Voorbeeldoutput
:tophat: "Tom Poes, verzin een list..."
:round_pushpin: Adres gevonden:
• Straat: lutherlaan
• Plaats: haarlem
• Postcode: 2014
• Locatie: 52.3988976, 5.28569541

✅ Nog te doen / uitbreidingen
 Validatie van Slack input uitbreiden.

 Ondersteuning voor meerdere woorden in straatnaam.

 Logging naar file of Slack.

 Automatische herbouw van JSON via cronjob.
```
## 🔄 Stroomdiagram Slack /adres

![Slack adres flow](docs/Fuse_Adres.png)


🔍 Uitbreiding /adres – Postcode opzoeken op basis van adres
Met deze uitbreiding op het bestaande /adres Slack-commando is het nu mogelijk om de postcode en locatie op te vragen op basis van een straatnaam, plaatsnaam en optioneel een huisnummer. De functionaliteit maakt gebruik van:

🔎 Fuzzy zoekfunctie via Fuse.js

🗃️ Realtime Oracle-query (indien huisnummer bekend is)

🗺️ Google Maps kaartweergave van de locatie (indien coördinaten beschikbaar zijn)

✅ Gebruik
Zonder huisnummer (fuzzy match):

/adres Lutherlaan Haarlem
Geeft:

Straatnaam

Plaats

Postcode (indien beschikbaar)

📍 Google Maps kaartje (indien coördinaten in de fuse-data.json aanwezig zijn)

Met huisnummer (database lookup):

/adres Lutherlaan 203 Haarlem
Geeft:

Straat, plaats en huisnummer

Exacte postcode (samengesteld uit WIJKCODE + LETTERCOMBINATIE)

📍 Google Maps kaartje (op basis van BREEDTEGRAAD en LENGTEGRAAD)

🛠️ Technisch overzicht
Fuzzy matching op straat + plaats via fuse-data.json

Bij opgegeven huisnummer → directe Oracle-query op KTB_PCDATA

Gegevens zoals WIJKCODE, LETTERCOMBINATIE, BREEDTEGRAAD, LENGTEGRAAD worden opgehaald

Kaartje gegenereerd via de Google Static Maps API

🔧 Nog in ontwikkeling
 fuse-data.json verrijken met meer coördinaten en postcodes

 Betere fallback wanneer coördinaten ontbreken

 Ondersteuning voor huisnummertoevoegingen zoals 1A, 2-B etc.

Laat maar weten als je dit ook meteen als commit comment wil gebruiken, dan help ik met pushen via Git ook als je wilt! 💪
