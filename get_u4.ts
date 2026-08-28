import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tangential-theme-2n50x",
  apiKey: "AIzaSyD-_luGshZAuSc_KNquCnYQqij5tQn4T6g",
  authDomain: "tangential-theme-2n50x.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, "ai-studio-cycleonpos-ef30f3c8-b05f-4029-b178-2cca0b8e2f4b");

async function printU4() {
  const uSnap = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'super_admin')));
  uSnap.docs.forEach(d => console.log(d.id, d.data()));
  process.exit(0);
}
printU4().catch(console.error);
