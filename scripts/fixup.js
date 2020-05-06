const { firestore } = require('./firebase');

/**
 *
 * @param {QueryDocumentSnapshot} doc
 */
async function fixDeclaration(doc) {
  // const data = doc.data();
  // console.log('Fixing declaration: ' + JSON.stringify(data));

  // const ref = firestore.collection('declarations');
  // await ref.add(data);

  // await doc.ref.delete();
}

/**
 *
 * @param {QuerySnapshot} docs
 */
function doFix(docs) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Found ${docs.size} to fix!`);
      const fixes = [];
      docs.forEach(doc => fixes.push(fixDeclaration(doc)));

      Promise.all(fixes).then(resolve).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

const startDate = new Date(2020, 3, 11, 17, 0, 0);
const endDate = new Date(2020, 4, 4, 18, 0, 0);

const declarationsRef = firestore.collection('declarations');
return declarationsRef
  .where('createdAt', '>=', startDate.getTime())
  .where('createdAt', '<=', endDate.getTime())
  .where('verified', '==', false)
  .get()
  .then(docs => doFix(docs).then(() => console.log('Done!')))
  .catch(err => console.error(err));
