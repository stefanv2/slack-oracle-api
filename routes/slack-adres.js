const express = require('express');
const router = express.Router();
const axios = require('axios');
const oracledb = require('oracledb');
const { getFuseInstance } = require('../tools/fuseHelper');

router.post('/slack/adres', async (req, res) => {
  const { text, response_url } = req.body;
  const parts = text.toLowerCase().trim().split(/\s+/);
if (parts.length < 2) {
  // Reageer snel binnen 3 sec!
  res.json({
    response_type: 'ephemeral',
    text: `❌ Geef een straat én plaats op, bijvoorbeeld: \`/adres lutherlaan haarlem\``
  });
  return;
}

const [straat, plaats] = parts;

  res.json({
    response_type: 'ephemeral',
    text: `⏳ Even geduld... adres voor *${straat} ${plaats}* wordt opgezocht.`
  });

  const fuse = getFuseInstance();
  if (!fuse) {
    await axios.post(response_url, {
      response_type: 'ephemeral',
      text: '❌ Interne fout: Fuse.js is niet geladen.'
    });
    return;
  }

  const result = fuse.search({ straat, plaats }, { limit: 1 });

  if (result.length === 0) {
    await axios.post(response_url, {
      response_type: 'in_channel',
      text: `❌ Geen resultaat gevonden voor *${straat}*, *${plaats}*.`
    });
    return;
  }

  const match = result[0].item;
  const { straat: matchedStraat, plaats: matchedPlaats, postcode } = match;

  try {
    const connection = await oracledb.getConnection();

    const dbResult = await connection.execute(
      `SELECT STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD 
       FROM POSTMAN.KTB_PCDATA 
       WHERE LOWER(STRAATNAAM) = :straat AND LOWER(PLAATSNAAM) = :plaats 
       FETCH FIRST 1 ROWS ONLY`,
      [match.straat, match.plaats],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (dbResult.rows.length === 0) {
      await axios.post(response_url, {
        response_type: 'in_channel',
        text: `❌ Geen locatiegegevens gevonden voor *${match.straat}*, *${match.plaats}*.`
      });
      return;
    }

    const { STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD } = dbResult.rows[0];

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${BREEDTEGRAAD},${LENGTEGRAAD}&zoom=16&size=600x300&markers=color:red%7C${BREEDTEGRAAD},${LENGTEGRAAD}&key=${process.env.GOOGLE_MAPS_API_KEY || ''}`;

    await axios.post(response_url, {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎩 *"Tom Poes, verzin een list..."*\n📍 *Adres gevonden:*\n• Straat: *${matchedStraat}*\n• Plaats: *${matchedPlaats}*\n• Postcode: *${postcode || 'onbekend'}*\n• Locatie: ${BREEDTEGRAAD}, ${LENGTEGRAAD}`

          }
        },
        {
          type: 'image',
          image_url: staticMapUrl,
          alt_text: `Locatie op kaart: ${STRAATNAAM}, ${PLAATSNAAM}`
        }
      ]
    });

    await connection.close();
  } catch (err) {
    console.error('❌ Fout bij ophalen adres:', err);
    await axios.post(response_url, {
      response_type: 'ephemeral',
      text: '❌ Er ging iets mis bij het ophalen van de locatiegegevens.'
    });
  }
});

module.exports = router;

