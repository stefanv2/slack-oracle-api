const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

let fuseInstance = null;

function loadFuseDataSync() {
  const dataPath = path.join(__dirname, 'fuse-data.json');
  const rawData = fs.readFileSync(dataPath);
  const adresData = JSON.parse(rawData);

  const options = {
    keys: ['straat', 'plaats'],
    threshold: 0.3,
    includeScore: true
  };

  fuseInstance = new Fuse(adresData, options);
  console.log(`✅ Fuse geladen met ${adresData.length} items`);
}

function getFuseInstance() {
  return fuseInstance;
}

module.exports = {
  loadFuseDataSync,
  getFuseInstance
};

