const express = require('express');
const router = express.Router();
const axios = require('axios');
const oracledb = require('oracledb');
const { getFuseInstance } = require('../tools/fuseHelper');

router.post('/slack/adres', async (req, res) => {
  const { text, response_url } = req.body;
  console.log('🔔 Slack input ontvangen:', text);

  if (!text || text.trim().length < 3) {
    return res.json({
      response_type: 'ephemeral',
      text: '❌ Gebruik: `/adres <straat> [huisnummer] <plaats>`'
    });
  }

  const parts = text.toLowerCase().trim().split(/\s+/);
  let straat = '';
  let plaats = '';
  let huisnummer = null;
  let huisletter = null;

  if (parts.length >= 3 && /^\d+[a-z]?$/.test(parts[parts.length - 2])) {
    plaats = parts.pop();
    const huisnrRaw = parts.pop();
    const match = huisnrRaw.match(/^(\d+)([a-z]?)$/);
    if (match) {
      huisnummer = match[1];
      huisletter = match[2] || null;
    }
    straat = parts.join(' ');
  } else {
    plaats = parts.pop();
    straat = parts.join(' ');
  }

  console.log(`➡️ Parsed straat: ${straat}`);
  console.log(`➡️ Parsed plaats: ${plaats}`);
  console.log(`➡️ Parsed huisnummer: ${huisnummer || ''}${huisletter || ''}`);

  res.json({
    response_type: 'ephemeral',
    text: `⏳ Bezig met opzoeken van *${straat} ${huisnummer || ''} ${plaats}*...`
  });

  try {
    const fuse = getFuseInstance();
    if (!fuse) {
      await axios.post(response_url, {
        response_type: 'ephemeral',
        text: '❌ Interne fout: Fuse is niet geladen.'
      });
      return;
    }

    const matches = fuse.search({ straat, plaats });
    console.log(`🔎 Fuse-resultaten gevonden: ${matches.length}`);

    if (matches.length === 0) {
      await axios.post(response_url, {
        response_type: 'in_channel',
        text: `❌ Geen fuzzy match gevonden voor *${straat} ${plaats}*`
      });
      return;
    }

    const topMatch = matches[0].item;
    console.log('✅ Beste fuzzy match:', topMatch);

    if (huisnummer) {
      const connection = await oracledb.getConnection();

      const result = await connection.execute(
        `SELECT STRAATNAAM, PLAATSNAAM, HUISNR, HUISNR_BAG_LETTER,
                WIJKCODE || LETTERCOMBINATIE AS POSTCODE,
                BREEDTEGRAAD, LENGTEGRAAD
         FROM POSTMAN.KTB_PCDATA
         WHERE LOWER(STRAATNAAM) = :straat
           AND LOWER(PLAATSNAAM) = :plaats
           AND HUISNR = :huisnr
           AND (LOWER(HUISNR_BAG_LETTER) = :letter OR :letter IS NULL)
         FETCH FIRST 1 ROWS ONLY`,
        {
          straat: topMatch.straat.toLowerCase(),
          plaats: topMatch.plaats.toLowerCase(),
          huisnr: parseInt(huisnummer),
          letter: huisletter
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      await connection.close();

      if (result.rows.length > 0) {
        const r = result.rows[0];
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${r.BREEDTEGRAAD},${r.LENGTEGRAAD}&zoom=16&size=600x300&markers=color:red%7C${r.BREEDTEGRAAD},${r.LENGTEGRAAD}&key=${process.env.GOOGLE_MAPS_API_KEY || ''}`;

        await axios.post(response_url, {
          response_type: 'in_channel',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `📍 *Adres gevonden:*\n• Straat: *${r.STRAATNAAM}*\n• Plaats: *${r.PLAATSNAAM}*\n• Huisnummer: *${r.HUISNR}${r.HUISNR_BAG_LETTER || ''}*\n• Postcode: *${r.POSTCODE}*`
              }
            },
            {
              type: 'image',
              image_url: staticMapUrl,
              alt_text: `Kaartlocatie ${r.STRAATNAAM} ${r.HUISNR}`
            }
          ]
        });
        return;
      } else {
        await axios.post(response_url, {
          response_type: 'in_channel',
          text: `❌ Geen huisnummer *${huisnummer}${huisletter || ''}* gevonden voor ${topMatch.STRAATNAAM}, ${topMatch.PLAATSNAAM}`
        });
        return;
      }
    }

// Geen huisnummer → fuzzy match tonen + kaartje
await axios.post(response_url, {
  response_type: 'in_channel',
  text: `🔎 *Fuzzy match:*\n📍 ${topMatch.straat}, ${topMatch.plaats} (${topMatch.postcode || ''})`,
  attachments: topMatch.BREEDTEGRAAD && topMatch.LENGTEGRAAD ? [
    {
      image_url: `https://maps.googleapis.com/maps/api/staticmap?center=${topMatch.BREEDTEGRAAD},${topMatch.LENGTEGRAAD}&zoom=16&size=600x300&markers=color:red%7C${topMatch.BREEDTEGRAAD},${topMatch.LENGTEGRAAD}&key=${GOOGLE_MAPS_API_KEY}`,
      alt_text: 'Kaartweergave'
    }
  ] : []
});

  } catch (err) {
    console.error('❌ Fout bij afhandeling:', err);
    await axios.post(response_url, {
      response_type: 'ephemeral',
      text: '❌ Interne fout bij het zoeken van het adres.'
    });
  }
});

module.exports = router;
