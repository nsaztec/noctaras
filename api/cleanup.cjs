const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteDreamsForEmails(emails) {
  for (const email of emails) {
    try {
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log('Found UID:', userRecord.uid);
      } catch(e) {
        console.log('User not found by email:', email);
        continue;
      }

      const snapshot = await db.collection('dreams').where('userId', '==', userRecord.uid).get();
      
      if (snapshot.empty) {
        console.log('No dreams found for', email);
      } else {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('SUCCESS: Deleted', snapshot.size, 'dreams for', email);
      }
      
    } catch (e) {
      console.error('Error handling', email, e.message);
    }
  }
}

deleteDreamsForEmails(['enes.pirt@gmail.com', 'solwen.yazici@gmail.com']).then(() => {
  console.log('Process finished!');
  process.exit(0);
});
