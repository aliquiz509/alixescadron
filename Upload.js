const admin = require('firebase-admin');
const fs = require('fs');

try {
  let serviceAccount;

  // 1. Tcheke si kle a nan anviwònman GitHub Actions an premye
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Si l pa jwenn li nan anviwònman an, li chèche fichiye lokal la (pou machin ou)
    const localKeyPath = "./serviceAccountKey.json";
    if (fs.existsSync(localKeyPath)) {
      serviceAccount = require(localKeyPath);
    } else {
      throw new Error("Kle sekirite Firebase la pa jwenn ni nan Secrets ni nan fichiye lokal la!");
    }
  }

  // 2. Inisyalize koneksyon ak Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Koneksyon ak Firebase reyisi! 🚀");
} catch (error) {
  console.error("Erreur nan inisyalizasyon Firebase:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 3. Li fichiye kesyon yo
const jsonPath = 'kesyon.json';
if (!fs.existsSync(jsonPath)) {
  console.error(`Erreur: Fichiye '${jsonPath}' la pa egziste nan dossier sa a.`);
  process.exit(1);
}

const questions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 4. Fonksyon pou voye done yo an mas (Batch)
async function importQuestions() {
  console.log(`Kòmanse enpòte ${questions.length} kesyon nan Firestore...`);
  
  let batch = db.batch();
  let count = 0;

  for (const q of questions) {
    // Kreye yon nouvo dokiman ak yon ID otomatik nan koleksyon 'questions'
    const docRef = db.collection('questions').doc(); 
    
    batch.set(docRef, {
      system: q.system,
      level: parseInt(q.level),
      question: q.question,
      options: q.options,
      answer: q.answer,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;

    // Firestore limite yon "batch" a 500 aksyon maksimòm pou chak ekriti.
    if (count % 500 === 0) {
      await batch.commit();
      batch = db.batch(); // Rekonstwi yon nouvo batch vid pou 500 pwochen yo
      console.log(`✅ ${count} kesyon fin voye nan Firestore...`);
    }
  }

  // Voye rès kesyon ki rete yo si total la pa t divizib pa 500
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`\n🎉 Tout bagay anfòm! Tout ${count} kesyon yo fin monte nan Firestore nèt!`);
}

// Lanse pwosesis la
importQuestions().catch(error => {
  console.error("Gen yon erè ki pase pandan upload la:", error);
  process.exit(1);
});
