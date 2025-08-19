// routes/slack.js
const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const axios = require('axios');

const createChartUrl = (labels, data, chartType = 'bar', title = '') => {
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: title,
        data,
      }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
        }
      },
      indexAxis: chartType === 'bar-horizontal' ? 'y' : 'x'
    },
  }))}`;
};

router.post('/grafiek', async (req, res) => {
  const { text, response_url } = req.body;
  const command = text.trim().toLowerCase();

  let query = '', chartType = 'bar', label = '';

  switch (command) {
    case 'kavels-provincie':
      query = `SELECT PROVINCIENAAM, COUNT(*) AS aantal FROM KTB_PCDATA GROUP BY PROVINCIENAAM ORDER BY aantal DESC`;
      label = 'Aantal kavels per provincie';
      break;

    case 'gebruiksdoel-provincie':
      query = `SELECT GEBRUIKSDOEL, COUNT(*) AS aantal FROM KTB_PCDATA GROUP BY GEBRUIKSDOEL ORDER BY aantal DESC FETCH FIRST 10 ROWS ONLY`;
      label = 'Gebruiksdoel van kavels (Top 10)';
      break;

    case 'gemiddeld-oppervlakte-gemeente':
      query = `SELECT GEMEENTENAAM, ROUND(AVG(OPPERVLAKTE), 2) AS gem FROM KTB_PCDATA GROUP BY GEMEENTENAAM ORDER BY gem DESC FETCH FIRST 10 ROWS ONLY`;
      label = 'Gemiddeld oppervlak per gemeente';
      chartType = 'bar-horizontal';
      break;

    case 'top-postcodegebieden':
      query = `SELECT LABEL, AANTAL_KAVELS
         FROM MV_TOP_POSTCODEGEBIEDEN
         ORDER BY AANTAL_KAVELS DESC
         FETCH FIRST 10 ROWS ONLY`
      label = 'Top 10 postcodegebieden met meeste kavels';
      chartType = 'bar-horizontal';
      break;

    default:
      return res.json({
        response_type: 'ephemeral',
        text: `❓ Onbekend subcommando: \`${command}\`\nBeschikbaar: \`kavels-provincie\`, \`gebruiksdoel-provincie\`, \`gemiddeld-oppervlakte-gemeente\`, \`top-postcodegebieden\``
      });
  }

  res.json({
    response_type: 'ephemeral',
    text: `⏳ Even geduld... grafiek "${label}" wordt opgehaald.`
  });

  try {
    const conn = await oracledb.getConnection();
    const result = await conn.execute(query);
    const rows = result.rows;
    const labels = rows.map(r => r[0]);
    const data = rows.map(r => r[1]);

    const finalChartType = chartType === 'bar-horizontal' ? 'bar' : chartType;
    const chartUrl = createChartUrl(labels, data, finalChartType, label);

    await axios.post(response_url, {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎩 *"Tom Poes, verzin een list..."*
Grafiek: *${label}*`
          }
        },
        {
          type: 'image',
          image_url: chartUrl,
          alt_text: label
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Als je begrijpt wat ik bedoel..._ — *O.B. Bommel*'
            }
          ]
        }
      ]
    });
  } catch (err) {
    console.error('❌ Fout bij ophalen grafiek:', err);
    await axios.post(response_url, {
      response_type: 'ephemeral',
      text: `❌ Fout bij het ophalen van de gegevens: ${err.message}`
    });
  }
});

const quotes = [
  "Als je begrijpt wat ik bedoel.",
  "Tom Poes, verzin een list!",
  "Geld speelt geen rol.",
  "Ik ben een eenvoudig man met eenvoudige genoegens.",
  "Dat is niet eerlijk, Tom Poes!",
  "Je maakt een grapje, hoop ik?",
  "Ik wil er best voor betalen, maar ik wil er dan ook wat voor hebben.",
  "Ik heb het altijd al gezegd.",
  "Ik wil rust in mijn leven!",
  "Het is allemaal de schuld van de maatschappij.",
  "Een heer doet dit niet.",
  "Er zijn grenzen, jonge vriend!",
  "Ik heb altijd gelijk gehad, maar niemand luisterde.",
  "Ik wil gewoon mijn leven leiden op mijn eigen manier.",
  "Kijk, daar gaat het mij nu juist om!",
  "Wat een toestand, Tom Poes!",
  "En dan heb ik het nog niet eens over de belasting!",
  "Dat is allemaal heel mooi, maar wat schiet ik ermee op?",
  "Het is niet mijn schuld, ik ben er ingerommeld!",
  "Rustig aan, ik ben een oud man.",
  "Een heer van stand maakt zich niet druk.",
  "Laat mij maar gewoon mijn gang gaan.",
  "Dit loopt vast weer slecht af.",
  "Zo is het altijd, als ik iets probeer te doen.",
  "Wat een toestand, en ik had net mijn jas laten stomen.",
  "Ik ben met de beste bedoelingen begonnen, maar zie nu waar ik ben beland!",
  "Ach jonge vriend, vroeger was alles simpeler — en duurder.", 
  "Ik wil geen gedoe, ik wil beschaving!",
  "Het is begonnen met een klein plan, en kijk nou eens...",
  "Een heer hoeft niet uit te leggen waarom hij gelijk heeft.",
  "Het was niet mijn schuld, ik stond erbij en keek ernaar.",
  "Ik wilde gewoon een rustige dag. Is dat te veel gevraagd?",
  "Soms denk ik: was ik maar een gewone beer gebleven.",
  "En ik zeg het u: ik ben er ingeluisd!",
  "Ik heb geen zin in narigheid, Tom Poes.",
  "Waarom moet mij dit altijd overkomen?",
  "Zoals gewoonlijk wordt er weer niet naar mij geluisterd.",
  "Dit riekt naar een complot tegen mijn persoon.",
  "Ik wil alleen maar met rust gelaten worden, is dat zo vreemd?",
  "Ik ben een man van principes, al heb ik ze niet altijd helder.",
  "Ongemak is mijn trouwe metgezel geworden.",
  "Ik ben een heer van stand, geen avonturier!",
  "Soms is het leven ingewikkelder dan een belastingformulier.",
  "Het begon als een goed idee, maar toen kwam de werkelijkheid.",
  "Ik had dit allemaal kunnen voorkomen, maar niemand vroeg het mij.",
  "Als ik geweten had waar ik aan begon, was ik thuisgebleven.",
  "Ik dacht even gelukkig te zijn, maar dat was van korte duur.",
  "Beschaving, Tom Poes! Dat is wat deze wereld nodig heeft!",
  "Ik vraag weinig, maar zelfs dat lijkt te veel.",
  "Mijn plan was feilloos... tot de uitvoering begon.",
  "Men vergeet dat ik óók gevoelens heb.",
  "Het zou allemaal zo mooi kunnen zijn, als men mij gewoon mijn zin gaf.",
  "Men vindt mijn persoons zo keurig dat ik er zelf bijna in ga geloven.",
  "Ik ben een man van de wereld, maar ik wil wel mijn eigen wereldje behouden."
];

router.post('/quote', async (req, res) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({
    response_type: "in_channel",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📜 *Bommel zegt:* \"${quote}\"`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🎲 Nieuwe quote"
            },
            action_id: "new_quote"
          }
        ]
      }
    ]
  });
});

router.post('/quote-action', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0];

  if (action.action_id === 'new_quote') {
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)];

    await axios.post(payload.response_url, {
      replace_original: true,
      response_type: 'in_channel',
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📜 *Bommel zegt:* \"${newQuote}\"`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "🎲 Nieuwe quote"
              },
              action_id: "new_quote"
            }
          ]
        }
      ]
    });
    res.status(200).end();
  }
});

router.post('/adres', async (req, res) => {
const { text } = req.body;

  if (!text || text.trim().split(' ').length < 2) {
    return res.json({
      response_type: 'ephemeral',
      text: '❗Gebruik: `/adres <straatnaam> <plaatsnaam>` (bijv. `/adres Dam Amsterdam`)'
    });
  }

const onderdelen = text.trim().split(' ');
const plaats = onderdelen.pop().toLowerCase();
const straat = onderdelen.join(' ').toLowerCase();

  res.json({
    response_type: 'ephemeral',
    text: `🔎 Zoeken naar adres: *${straat}* in *${plaats}*...`
  });

  try {
    const conn = await oracledb.getConnection();
    const result = await conn.execute(
      `SELECT STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD
       FROM POSTMAN.KTB_PCDATA
       WHERE LOWER(STRAATNAAM) = :straat AND LOWER(PLAATSNAAM) = :plaats
       FETCH FIRST 1 ROWS ONLY`,
      { straat, plaats },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      await axios.post(req.body.response_url, {
        response_type: 'ephemeral',
        text: `❌ Geen resultaat gevonden voor *${straat}*, *${plaats}*.`
      });
      return;
    }

    const { STRAATNAAM, PLAATSNAAM, BREEDTEGRAAD, LENGTEGRAAD } = result.rows[0];
    const kaartUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${BREEDTEGRAAD},${LENGTEGRAAD}&zoom=16&size=600x300&markers=color:orange%7C${BREEDTEGRAAD},${LENGTEGRAAD}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    await axios.post(req.body.response_url, {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📍 *Adres gevonden:*\n*Straat:* ${STRAATNAAM}\n*Plaats:* ${PLAATSNAAM}`
          }
        },
        {
          type: 'image',
          image_url: kaartUrl,
          alt_text: 'Kaartweergave van adres'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Als je begrijpt wat ik bedoel..._'
            }
          ]
        }
      ]
    });
  } catch (err) {
    console.error('❌ Fout bij adreszoeking:', err);
    await axios.post(req.body.response_url, {
      response_type: 'ephemeral',
      text: `❌ Fout bij zoeken naar adres: ${err.message}`
    });
  }
});

module.exports = router;

