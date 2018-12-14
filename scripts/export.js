const fs = require('fs');
const path = require('path');
const { firestore } = require('./firebase');

const filePath = path.join(__dirname, 'exports.csv');

function createLine(doc) {
  const data = doc.data();
  return `${data.email},${data.firstName},${data.lastName}`;
}

function doExport(docs) {
  return new Promise((resolve, reject) => {
    const lines = [];
    docs.forEach(d => lines.push(createLine(d)));
    try {
      const data = lines.join("\n");
      fs.writeFile(filePath, data, { encoding: 'utf8' }, (err) => {
        if (err) {
          reject(err);
        }

        console.info(`Successfully exported to: ${filePath.toString()}`);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

const declarationsRef = firestore.collection('declarations');
return declarationsRef.where('verified', '==', true)
  .get()
  .then(docs => doExport(docs))
  .catch(err => console.error(err));
