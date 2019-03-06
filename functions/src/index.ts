import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase app in order to use Firestore
const firebase = admin.initializeApp();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: false });

import * as rp from 'request-promise-native';
import * as express from 'express';
import * as path from 'path';
import * as exphb from 'express-handlebars';
import { check, validationResult } from 'express-validator/check';

import { Mailer } from './mailer';
const mailer = new Mailer(functions.config().sendgrid.key);

// Create Express app
const app = express();

app.engine('handlebars', exphb({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/../views'));

// Setup body parsing
app.use(express.urlencoded({ extended: false }));

/**
 * Main Route
 */
app.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.render('home');
});

/**
 * Declaration Route
 */
app.post('/declare', [
  check('email', 'Den angivet email er ugyldig!').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('home', {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      errors: errors.array(),
    });
  }

  // Construct the declaration object
  const declaration = {
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    email: (req.body.email as string).toLowerCase()
  };

  const declarationsRef = db.collection('declarations');

  // Email must not already exist
  const emailExists = await declarationsRef.where('email', '==', declaration.email).get();
  if (!emailExists.empty) {
    return res.render('thanx');
  }

  // Store the info as a voter declaration
  const ref = await declarationsRef.add({
    ...declaration,
    createdAt: Date.now(),
    verified: false
  });
  console.log('Successfully added a new voter declaration', ref.id, declaration);

  res.render('thanx', { email: req.body.email });
});

/**
 * Email Verification Route
 */
app.get('/verify/:token', async (req, res) => {
  console.log('Verifying with token:', req.params.token);
  const declarationRef = db.collection('declarations').doc(req.params.token);
  const declaration = await declarationRef.get();
  if (!declaration.exists) {
    return res.render('verify');
  }

  const data = declaration.data();

  // Only verify if not already verified
  if (data.verified === true) {
    return res.render('verify', { verified: true });
  }

  declarationRef.update({
    ...data,
    verified: true,
    verifiedAt: Date.now()
  })
    .then(() => {
      res.render('verify', { verified: true });
    })
    .catch(error => {
      console.error('Email verification failed:', error);
      res.render('verify');
    });
});

export const vdr = functions.https.onRequest(app);

/**
 * Send a verification email upon creation of a declaration
 */
export const sendVerificationEmail = functions.firestore
  .document('declarations/{declarationId}')
  .onCreate(async (snapshot, ctx) => {
    console.log('Sending verification email..', snapshot, ctx);
    const data = snapshot.data();
    const id = ctx.params.declarationId;
    const projectId = process.env.GCLOUD_PROJECT;
    const link = `https://${projectId}.firebaseapp.com/verify/${id}`;

    return mailer.sendVerificationEmail(data.firstName || '', data.email, link);
  });


/**
 * Aggregate declarations upon creation of a declaration
 */
export const aggregateDeclarations = functions.firestore
  .document('declarations/{declarationId}')
  .onCreate(async (snapshot, ctx) => {
    console.log('Aggregating declarations..', snapshot, ctx);
    const totalsRef = db.collection('aggregates').doc('totals');

    return db.runTransaction(t => {
      return t.get(totalsRef)
        .then(doc => {
          if (!doc.exists) {
            t.set(totalsRef, { declarations: 1 });
          } else {
            t.update(totalsRef, {
              ...doc.data(),
              declarations: (doc.data().declarations || 0) + 1
            });
          }
        });
    });
  });

/**
 * Aggregate verified declarations upon verification of an email
 */
export const aggregateVerifications = functions.firestore
  .document('declarations/{declarationId}')
  .onUpdate(async (change, ctx) => {
    console.log('Aggregating verifications..', change, ctx);

    // Only aggregate if the email is actually verified
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!(beforeData.verified === false && afterData.verified === true)) {
      return Promise.resolve();
    }

    const totalsRef = db.collection('aggregates').doc('totals');
    return db.runTransaction(t => {
      return t.get(totalsRef)
        .then(doc => {
          if (!doc.exists) {
            t.set(totalsRef, { verifications: 1 });
          } else {
            t.update(totalsRef, {
              ...doc.data(),
              verifications: (doc.data().verifications || 0) + 1
            });
          }
        });
    });
  });

/**
 * Export verified email to MailChimp using their API
 */
export const exportVerifiedEmail = functions.firestore
  .document('declarations/{declarationId}')
  .onUpdate((change, ctx) => {
    console.log('Exporting email..', change.after.data(), ctx);

    // Only export if the email is actually verified
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!(beforeData.verified === false && afterData.verified === true)) {
      return Promise.resolve();
    }

    const listId = functions.config().mailchimp.listid;
    const apiKey = functions.config().mailchimp.apikey;

    const basicAuth = Buffer.from(`vdr:${apiKey}`).toString('base64');
    const options = {
      method: 'POST',
      uri: `https://us14.api.mailchimp.com/3.0/lists/${listId}/members`,
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: {
        email_address: afterData.email,
        status: 'subscribed'
      },
      json: true
    };

    return rp(options);
  });
