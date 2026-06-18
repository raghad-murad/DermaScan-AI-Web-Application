const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function seedAdmin() {
  const email = "main_admin@gmail.com";
  const password = "main_admin_123";
  const fullName = "Yazan Abu Farha";

  // Create the Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: fullName,
  });

  console.log("Created auth user:", userRecord.uid);

  // Create the matching Firestore profile document
  await db.collection("users").doc(userRecord.uid).set({
    full_name: fullName,
    email: email,
    role: "admin",
    created_at: new Date().toISOString(),
  });

  console.log("Created Firestore profile for admin with role: admin");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
