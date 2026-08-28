import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tangential-theme-2n50x",
  apiKey: "AIzaSyD-_luGshZAuSc_KNquCnYQqij5tQn4T6g",
  authDomain: "tangential-theme-2n50x.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, "ai-studio-cycleonpos-ef30f3c8-b05f-4029-b178-2cca0b8e2f4b");

async function printData() {
  const tSnap = await getDocs(collection(firestore, 'tenants'));
  console.log("Tenants:");
  tSnap.docs.forEach(d => console.log(d.id, d.data().name));

  const uSnap = await getDocs(collection(firestore, 'users'));
  console.log("\nUsers:");
  uSnap.docs.forEach(d => console.log(d.id, d.data().full_name, d.data().role));

  process.exit(0);
}
printData().catch(console.error);
