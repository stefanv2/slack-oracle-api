const oracledb = require('oracledb');
require('dotenv').config({ path: '.env.adres' });

const { loadFuseData, getFuseInstance } = require('../lib/fuseLoader');

async function test() {
  await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTSTRING
  });

  await loadFuseData();

  const fuse = getFuseInstance();
  console.log(`✅ Fuse geladen met ${fuse.getIndex().size()} items`);
  const result = fuse.search({ straat: 'stationsstr', plaats: 'apeldoorn' }, { limit: 3 });
  console.log('🔍 Resultaten:', result);
}

test().then(() => process.exit()).catch(console.error);

