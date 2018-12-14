const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://jfk21-vdr.firebaseio.com'
});

module.exports = {
  admin,
  firestore: admin.firestore()
};
