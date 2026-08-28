import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tangential-theme-2n50x",
  apiKey: "AIzaSyD-_luGshZAuSc_KNquCnYQqij5tQn4T6g",
  authDomain: "tangential-theme-2n50x.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, "ai-studio-cycleonpos-ef30f3c8-b05f-4029-b178-2cca0b8e2f4b");

async function fix() {
  console.log("Fetching broken orders...");
  let count = 0;
  
  // Delivered but no final_amount
  const qDel = query(collection(firestore, 'orders'), where('status', '==', 'delivered'));
  const snapDel = await getDocs(qDel);
  for (const d of snapDel.docs) {
    const data = d.data();
    if (data.final_amount === undefined) {
      console.log(`Fixing ${d.id}`);
      await updateDoc(doc(firestore, 'orders', d.id), { status: 'completed' });
      count++;
    }
  }

  // iron but workflow wash_dry
  const qIron = query(collection(firestore, 'orders'), where('status', '==', 'iron'), where('workflow', '==', 'wash_dry'));
  const snapIron = await getDocs(qIron);
  for (const d of snapIron.docs) {
    console.log(`Fixing stuck iron ${d.id}`);
    await updateDoc(doc(firestore, 'orders', d.id), { status: 'completed' });
    count++;
  }
  
  console.log(`Fixed ${count} orders`);
  process.exit(0);
}

fix().catch(console.error);
