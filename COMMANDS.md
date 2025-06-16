# 📑 Slack Slash Commands

Een overzicht van alle beschikbare slash-commando's in deze Slack-integratie met uitleg en voorbeelden.

---

## `/postcode <postcode>`

🔍 **Zoek adresgegevens op uit de Oracle-database**

### Voorbeeld:
/postcode 1234AB

### Resultaat:
- Straatnaam
- Plaatsnaam
- Google Maps afbeelding van locatie (optioneel)

---

## `/grafiek <subcommando>`

📊 **Genereert een grafiek op basis van Oracle-data**

### Subcommando's:

- **`kavels-provincie`**  
  → Aantal kavels per provincie

- **`gebruiksdoel-provincie`**  
  → Top 10 gebruiksdoelen van kavels

- **`gemiddeld-oppervlakte-gemeente`**  
  → Gemiddeld oppervlak per gemeente

- **`top-postcodegebieden`**  
  → Top 10 postcodegebieden met meeste kavels  
  (Gebaseerd op materialized view)

### Voorbeeld:
/grafiek gemiddeld-oppervlakte-gemeente

---

## `/quote`

📜 **Geeft een willekeurige quote van Olivier B. Bommel**

### Voorbeeld:
/quote

### Resultaat:
> *"Als je begrijpt wat ik bedoel..." — O.B. Bommel*

---

## 💡 Tips

- Gebruik `/grafiek` als basis en breid uit met meer subcommando’s
- De `/quote` route is makkelijk uit te breiden met meerdere quotes

