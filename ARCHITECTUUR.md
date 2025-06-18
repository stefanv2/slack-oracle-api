# 🏗️ ARCHITECTUUR.md - Slack Oracle Bot

Dit document beschrijft de structuur, samenwerking en uitbreidingsmogelijkheden van de Slack Oracle Bot-applicatie.

---

## 📁 Bestandsoverzicht

### `index.js` – **Startpunt van de applicatie**

- Initialiseert de Express server.
- Maakt verbinding met de Oracle Database via een connection pool.
- Bepaalt op basis van de `.env`-variabele `SERVICE` welk type bot wordt gestart:

| SERVICE Waarde     | Betekenis                          |
|--------------------|-------------------------------------|
| `postcode`         | Activeert de `/postcode` handler    |
| `quotegrafiek`     | Activeert alle `/slack/...` routes  |

Voorbeeld:
```js
if (process.env.SERVICE === 'quotegrafiek') {
  const slackRoutes = require('./routes/slack');
  app.use('/slack', slackRoutes);
}
```

---

### `routes/slack.js` – **Afhandeling van Slack commando’s**

Bevat logica voor:
- `/grafiek` subcommando’s:
  - `kavels-provincie`
  - `gebruiksdoel-provincie`
  - `gemiddeld-oppervlakte-gemeente`
  - `top-postcodegebieden`
- `/quote` & `/quote-action`
- `/adres` (zoek straat + plaats)
- Verwerking van `response_url` (Slack async responses)
- Optioneel: fuzzy zoekondersteuning via `fuse.js`

```js
router.post('/quote', async (req, res) => { ... });
router.post('/grafiek', async (req, res) => { ... });
router.post('/adres', async (req, res) => { ... });
```

---

## 🔄 Samenwerking tussen bestanden

- `index.js` start de server en connectie met Oracle.
- `routes/slack.js` bevat logica voor Slack endpoints.
- De waarde van `SERVICE` in `.env` bepaalt welke route actief is.

---

## ⚠️ Veelvoorkomende Valkuilen

| Probleem | Oplossing |
|---------|-----------|
| `Cannot read property 'text' of undefined` | Slack stuurt geen `text`-veld – check met `if (!req.body.text)` |
| `NJS-047: pool alias not found` | `oracledb.getConnection()` werd te vroeg aangeroepen – wacht op pool-init |
| `/slack/...` geeft 404 | Verkeerde `SERVICE` actief of container luistert niet op juiste poort |
| `.env` niet geladen | Zorg dat `--env-file` meegegeven wordt in `docker run` |
| Dockerfile mist `npm install fuse.js` | Voeg toe: `RUN npm install fuse.js` |

---

## 🔧 Uitbreiden

### Een nieuw Slack commando toevoegen:

1. Voeg toe in `slack.js`:
```js
router.post('/nieuw-commando', async (req, res) => {
  const input = req.body.text.trim();
  ...
});
```

2. Voeg commando toe in je Slack App config (Slash Commands).
3. Herstart Docker container.
4. Test met `curl` of via Slack.

---

## 🛠️ Tips

- Gebruik `.env.quotegrafiek` en `.env.postcode` om makkelijk te wisselen
- Gebruik `screen` of `tmux` om `ngrok` actief te houden
- Voeg debug logs toe via `console.log()` in je handlers
- Splits grote routebestanden in modules als `routes/quote.js`, `routes/grafiek.js`

---

## 👨‍💻 Auteur

Gemaakt door Stefan Voorbij Repo: [slack-oracle-api](https://github.com/stefanv2/slack-oracle-api)