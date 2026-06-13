const admin = require('firebase-admin');
const fs = require('fs');

// Verifye si l ap kouri sou GitHub oswa an lokal
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// ... rès kòd la rete menm jan an
