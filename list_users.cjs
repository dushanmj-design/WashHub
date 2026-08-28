const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "tangential-theme-2n50x",
  apiKey: "AIzaSyD-_luGshZAuSc_KNquCnYQqij5tQn4T6g",
  authDomain: "tangential-theme-2n50x.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-cycleonpos-ef30f3c8-b05f-4029-b178-2cca0b8e2f4b");

async function run() {
  const snap = await getDocs(collection(db, 'users'));
  snap.forEach(doc => console.log(doc.id, doc.data()));
}
run().catch(console.error);
