const express = require('express');
const oracledb = require('oracledb');
const adresRouter = require('./routes/slack-adres');
const { loadFuseDataSync } = require('./tools/fuseHelper');
require('dotenv').config({ path: '.env.adres' });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function init() {
  try {
    loadFuseDataSync(); // JSON laden vóór Oracle
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTSTRING
    });
    console.log('✅ Oracle connection pool aangemaakt');

    app.use('/', adresRouter);
    app.listen(3002, () => {
      console.log('🚀 Server draait op http://localhost:3002');
    });
  } catch (err) {
    console.error('❌ Fout bij starten server:', err);
  }
}

init();

