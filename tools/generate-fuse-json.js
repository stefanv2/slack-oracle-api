const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.adres' });

async function main() {
  console.log('🚀 Start generate-fuse-json.js');

  const { DB_USER, DB_PASSWORD, DB_CONNECTSTRING } = process.env;

  if (!DB_USER || !DB_PASSWORD || !DB_CONNECTSTRING) {
    throw new Error('❌ DB connectiegegevens ontbreken in .env.adres');
  }

  console.log('🔐 Connectiegegevens geladen:', {
    user: DB_USER,
    connectString: DB_CONNECTSTRING
  });

  let pool;
  try {
    console.log('🔌 Verbinden met Oracle...');
    pool = await oracledb.createPool({
      user: DB_USER,
      password: DB_PASSWORD,
      connectString: DB_CONNECTSTRING
    });

    const connection = await pool.getConnection();
    console.log('✅ Verbonden met Oracle');

    console.log('📡 Query wordt gestart...');
    const result = await connection.execute(
      `SELECT DISTINCT STRAATNAAM, PLAATSNAAM, WIJKCODE FROM POSTMAN.KTB_PCDATA`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log(`📦 ${result.rows.length} adressen opgehaald`);
    console.log("Eerste rij:", result.rows[0]); // <<< Nieuw toegevoegd

    // Correcte mapping
    const adresData = result.rows.map(r => ({
      straat: r.STRAATNAAM ? r.STRAATNAAM.toLowerCase() : '',
      plaats: r.PLAATSNAAM ? r.PLAATSNAAM.toLowerCase() : '',
      postcode:r.WIJKCODE
    })).filter(r => r.straat && r.plaats);

    const jsonPath = path.join(__dirname, 'fuse-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(adresData, null, 2));
    console.log(`✅ JSON opgeslagen in ${jsonPath}`);

    await connection.close();
    await pool.close();
    console.log('🧹 Connectie gesloten');
  } catch (err) {
    console.error('❌ Fout tijdens genereren van fuse-data.json:', err);
    if (pool) await pool.close();
  }
}

main();

