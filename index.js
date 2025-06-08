
require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const poolConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTSTRING,
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1,
};

app.use(express.urlencoded({ extended: true }));

async function init() {
  try {
    await oracledb.createPool(poolConfig);
    console.log('✅ Oracle connection pool aangemaakt');
  } catch (err) {
    console.error('❌ Fout bij maken pool:', err);
    process.exit(1);
  }
}

app.post('/postcode', async (req, res) => {
  const start = Date.now();
  const input = req.body.text || '';
  const match = input.trim().toUpperCase().match(/^([0-9]{4})([A-Z]{2})$/);

  if (!match) {
    return res.json({ response_type: 'ephemeral', text: ':warning: Geef een postcode op, bijv. /postcode 1234AB' });
  }

  const wijkcode = match[1];
  const lettercombinatie = match[2];

  console.log(`Slack stuurde postcode: ${wijkcode}${lettercombinatie}`);

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD FROM POSTMAN.KTB_PCDATA
       WHERE WIJKCODE = :wijkcode AND LETTERCOMBINATIE = :lettercombinatie`,
      { wijkcode, lettercombinatie },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.json({ response_type: 'ephemeral', text: `❌ Geen resultaat gevonden voor postcode *${wijkcode}${lettercombinatie}*.` });
    }

    const { STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD } = result.rows[0];
    const kaartUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${BREEDTEGRAAD},${LENGTEGRAAD}&zoom=16&size=600x300&markers=color:orange%7C${BREEDTEGRAAD},${LENGTEGRAAD}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📮 *Resultaat voor postcode ${wijkcode}${lettercombinatie}:*\n*Straat:* ${STRAATNAAM}\n*Plaats:* ${PLAATSNAAM}`
          }
        },
        {
          type: 'image',
          title: { type: 'plain_text', text: 'Kaartweergave', emoji: true },
          image_url: kaartUrl,
          alt_text: 'Locatie op kaart'
        }
      ]
    };

    res.json(response);
  } catch (err) {
    console.error('❌ Fout bij verwerking:', err);
    res.status(500).json({ text: '❌ Er ging iets mis met het ophalen van de postcodegegevens.' });
  } finally {
    if (connection) await connection.close();
    const duration = Date.now() - start;
    console.log(`⏱️ Verwerking duurde ${duration} ms`);
  }
});

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  try {
    await oracledb.getPool().close(0);
    console.log('🔌 Verbinding met database pool gesloten');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fout bij sluiten pool:', err);
    process.exit(1);
  }
});

init();

