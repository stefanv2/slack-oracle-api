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

router.post('/quote', async (req, res) => {
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
];
const quote = quotes[Math.floor(Math.random() * quotes.length)]; 
   res.json({
   response_type: "ephemeral",
   text: `📜 *Bommel zegt:* "${quote}"`
		    });
});

module.exports = router;

