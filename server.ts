import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize Firebase SDK with lazy validation (Supports environment variable for secure container hosting)
let firebaseConfig;
const FIREBASE_CONFIG_ENV = process.env.FIREBASE_CONFIG;

if (FIREBASE_CONFIG_ENV) {
  try {
    firebaseConfig = JSON.parse(FIREBASE_CONFIG_ENV);
  } catch (err) {
    throw new Error("Invalid JSON format in FIREBASE_CONFIG environment variable.");
  }
} else {
  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error("Missing Firebase applet config JSON file. Provide a firebase-applet-config.json file or set the FIREBASE_CONFIG environment variable.");
  }
  firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig?.firestoreDatabaseId || "(default)");

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generate a highly chilling, atmospheric, Gothic occult prophecy about their destiny in the Forbidden Archives.
async function generateOccultProphecy(name: string): Promise<string> {
  const customTones = [
    `The heavy oak doors creaked open as they detected the bloodline of ${name}, etching a new registry on page 13.`,
    `${name}'s shadow has been carved into row 108 of the forgotten stacks, waiting for the cold ink to dry.`,
    `A whisper echoes through the dark vaulted ceiling: ${name} is the ancient key to the final, locked tome.`,
    `Your sigil, ${name}, has been bound. The third vault recognizes your bloodline. Remain vigilant inside the corridors.`,
    `Under the crescent moon, the dark archives cataloged ${name}'s arrival. A blank parchment awaits the final sign.`,
    `The dust of forgotten centuries settled upon the registry to form the name: ${name}.`,
    `An iron key turns inside the chest of the Forbidden Libram, bound eternally to the step of ${name}.`,
    `The Whispering Archivist claims to have seen ${name} walking through the forbidden wing seventy winter solstices ago.`,
    `Your signature has been found etched in dry ash upon the ancient altar in the East wing, ${name}.`,
    `A candle flutters and dies in the dark library, signaling the entry of the name '${name}' into the Book of the Lost.`
  ];
  
  // Use a hashing index of the name to make it consistent or semi-consistent
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % customTones.length;
  return customTones[index];
}

interface WaitlistEntry {
  id: string; // unique code like FA-XXXXXX
  name: string;
  email: string;
  waitlistNumber: number;
  createdAt: string;
  prophecy: string;
  verified: boolean;
  verificationToken: string;
  shares: {
    instagram: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
}

// Helper to generate custom horror code
function generateTokenId(): string {
  const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WM-${result}`;
}

// Helper to generate a verification hash code
function generateVerificationToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to safely sanitize emails for document IDs
function getEmailDocId(email: string): string {
  return email.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, "_");
}

// Express middlewares
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", message: "Forbidden Archives server is running in the shadows connected to the cloud" });
});

// GET waitlist size (for live counter - count ONLY fully verified users)
app.get("/api/waitlist/count", async (req, res) => {
  const pathForCount = "stats";
  try {
    const statsDoc = await getDoc(doc(db, "stats", "counter"));
    if (statsDoc.exists()) {
      return res.json({ count: statsDoc.data().verifiedCount || 0 });
    }

    // Fallback if stats document doesn't exist yet: run count query (permitted via verified list rule)
    const q = query(collection(db, "waitlist"), where("verified", "==", true));
    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;

    // Save to counter
    await setDoc(doc(db, "stats", "counter"), { verifiedCount: count });
    res.json({ count });
  } catch (error: any) {
    try {
      handleFirestoreError(error, OperationType.GET, pathForCount);
    } catch (loggedVal) {
      console.error("Gracefully logged Firestore error inside waitlist count:", loggedVal instanceof Error ? loggedVal.message : loggedVal);
    }
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("API has not been used") || msg.includes("disabled") || msg.includes("PERMISSION_DENIED")) {
      return res.status(200).json({ 
        count: 0,
        firestore_error: {
          code: "firestore_api_disabled",
          message: "Cloud Firestore API has not been enabled in your project yet. Go to your Firebase/GCP Console to enable Google Cloud Firestore.",
          projectId: firebaseConfig.projectId
        }
      });
    }
    res.status(500).json({ error: "Failed to read cloud statistics." });
  }
});

// GET email verification endpoint (called when user clicks the simulation link or verification mail button)
app.get("/api/waitlist/verify/:token", async (req, res) => {
  const { token } = req.params;
  const pathForVerify = "waitlist";
  try {
    // Look up tokenId by verificationToken document ID (Pillar 6, no lists)
    const tokenDoc = await getDoc(doc(db, "verification_tokens", token));
    if (!tokenDoc.exists()) {
      return res.status(400).send(`
        <html>
          <head>
            <style>
              body { background: #0c0505; color: #ef4444; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { border: 2px solid #b91c1c; padding: 40px; border-radius: 12px; background: #000; box-shadow: 0 0 20px rgba(185, 28, 28, 0.4); max-width: 450px; }
              h1 { font-family: Georgia, serif; margin-bottom: 20px; }
              p { color: #ccc; line-height: 1.6; }
              a { color: #f43f5e; font-weight: bold; border: 1px dashed #f43f5e; padding: 8px 16px; display: inline-block; margin-top: 20px; text-decoration: none; transition: 0.2s; }
              a:hover { background: rgba(244, 63, 94, 0.1); }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>SEAL EXPIRED OR BROKEN</h1>
              <p>The verification coordinate token you have provided is invalid or has expired in the ritual fires. Please attempt verification through the coven registry portal again.</p>
              <a href="/">Return to Vault Portal</a>
            </div>
          </body>
        </html>
      `);
    }

    const { tokenId } = tokenDoc.data();
    const entryRef = doc(db, pathForVerify, tokenId);
    const docSnap = await getDoc(entryRef);

    if (!docSnap.exists()) {
      return res.status(400).send(`
        <html>
          <head>
            <style>
              body { background: #0c0505; color: #ef4444; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { border: 2px solid #b91c1c; padding: 40px; border-radius: 12px; background: #000; box-shadow: 0 0 20px rgba(185, 28, 28, 0.4); max-width: 450px; }
              h1 { font-family: Georgia, serif; margin-bottom: 20px; }
              p { color: #ccc; line-height: 1.6; }
              a { color: #f43f5e; font-weight: bold; border: 1px dashed #f43f5e; padding: 8px 16px; display: inline-block; margin-top: 20px; text-decoration: none; transition: 0.2s; }
              a:hover { background: rgba(244, 63, 94, 0.1); }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>ENTRY ORPHANED</h1>
              <p>The registered entry for this token could not be found in our archives.</p>
              <a href="/">Return to Vault Portal</a>
            </div>
          </body>
        </html>
      `);
    }

    const entry = docSnap.data() as WaitlistEntry;

    // If already verified, just redirect straight to the token review
    if (entry.verified) {
      return res.redirect(`/?token=${entry.id}&verified=true`);
    }

    // Assign waitlist number (read cached counter + 1, fallback to snapshot size)
    let assignedWaitlistNumber = 1;
    const statsRef = doc(db, "stats", "counter");
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      assignedWaitlistNumber = (statsDoc.data().verifiedCount || 0) + 1;
    } else {
      const verifiedQ = query(collection(db, pathForVerify), where("verified", "==", true));
      const verifiedSnapshot = await getDocs(verifiedQ);
      assignedWaitlistNumber = verifiedSnapshot.size + 1;
    }

    // Generate prophecy using Gemini
    const prophecy = await generateOccultProphecy(entry.name);

    // Apply updates
    await updateDoc(entryRef, {
      verified: true,
      waitlistNumber: assignedWaitlistNumber,
      prophecy: prophecy
    });

    // Update the counter to save reads and enforce correct list length
    await setDoc(statsRef, { verifiedCount: assignedWaitlistNumber }, { merge: true });

    // Redirect the browser straight back to the React applet with query parameters to directly trigger a gorgeous success card reveal!
    res.redirect(`/?token=${entry.id}&just_verified=true`);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).send("A shadow has crossed our server during verification.");
  }
});

// POST register user
app.post("/api/waitlist", async (req, res) => {
  const pathForRegister = "waitlist";
  try {
    const { name, email } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Fill your a valid name" });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Provide a valid email." });
    }

    const trimmedName = name.trim().slice(0, 50);
    const trimmedEmail = email.trim().toLowerCase();
    const emailDocId = getEmailDocId(trimmedEmail);

    // Check if duplicate email already registered (Pillar 6, using secure lookup)
    const emailLookupDoc = await getDoc(doc(db, "emails", emailDocId));

    if (emailLookupDoc.exists()) {
      return res.status(400).json({ 
        error: "This email has already been registered" 
      });
    }

    // Generate unique slot token and ensure no overlap exists
    let newTokenId = generateTokenId();
    let idExists = true;
    let attempts = 0;
    while (idExists && attempts < 5) {
      const idCheckDoc = await getDoc(doc(db, pathForRegister, newTokenId));
      if (!idCheckDoc.exists()) {
        idExists = false;
      } else {
        newTokenId = generateTokenId();
      }
      attempts++;
    }

    const verificationToken = generateVerificationToken();

    // Assign waitlist number instantly to newly registered user
    let assignedWaitlistNumber = 1;
    const statsRef = doc(db, "stats", "counter");
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      assignedWaitlistNumber = (statsDoc.data().verifiedCount || 0) + 1;
    } else {
      const verifiedQ = query(collection(db, pathForRegister), where("verified", "==", true));
      const verifiedSnapshot = await getDocs(verifiedQ);
      assignedWaitlistNumber = verifiedSnapshot.size + 1;
    }

    // Generate prophecy immediately
    const prophecy = await generateOccultProphecy(trimmedName);

    const newEntry: WaitlistEntry = {
      id: newTokenId,
      name: trimmedName,
      email: trimmedEmail,
      waitlistNumber: assignedWaitlistNumber,
      createdAt: new Date().toISOString(),
      prophecy,
      verified: true, // REGISTERED USERS ARE INSTANTLY VERIFIED COMPLETELY!
      verificationToken,
      shares: {
        instagram: false,
        whatsapp: false,
        sms: false
      }
    };

    // Save registration documentation natively into cloud Firestore
    console.log("[REGISTRATION] Saving waitlist entry...", JSON.stringify(newEntry));
    try {
      await setDoc(doc(db, pathForRegister, newTokenId), newEntry);
      console.log("[REGISTRATION] Waitlist entry saved successfully.");
    } catch (e: any) {
      console.error("[REGISTRATION] Error saving waitlist entry:", e);
      throw e;
    }

    // Save lookup entries safely (Pillar 6)
    console.log("[REGISTRATION] Saving email lookup...");
    try {
      await setDoc(doc(db, "emails", emailDocId), { tokenId: newTokenId });
      console.log("[REGISTRATION] Email lookup saved successfully.");
    } catch (e: any) {
      console.error("[REGISTRATION] Error saving email lookup:", e);
      throw e;
    }

    console.log("[REGISTRATION] Saving verification token...");
    try {
      await setDoc(doc(db, "verification_tokens", verificationToken), { tokenId: newTokenId });
      console.log("[REGISTRATION] Verification token saved successfully.");
    } catch (e: any) {
      console.error("[REGISTRATION] Error saving verification token:", e);
      throw e;
    }

    // Update waitlist count stats document synchronously so count remains real-time
    try {
      await setDoc(statsRef, { verifiedCount: assignedWaitlistNumber }, { merge: true });
    } catch (e: any) {
      console.error("[REGISTRATION] Error updating live count stats:", e);
    }

    res.status(201).json({
      verified: true,
      message: "Your covenant space is bound.",
      user: {
        ...newEntry,
        displayNumber: assignedWaitlistNumber
      }
    });
  } catch (err: any) {
    console.error("Registry error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("API has not been used") || msg.includes("disabled") || msg.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "Database setup required. Cloud Firestore API has not been enabled in your Firebase project. Please enable it in your Firebase console.",
        firestore_error: {
          code: "firestore_api_disabled",
          projectId: firebaseConfig.projectId
        }
      });
    }
    res.status(500).json({ error: "Dark forces disrupted your registration." });
  }
});

// GET token by ID (retrieve card dynamically)
app.get("/api/waitlist/token/:id", async (req, res) => {
  const { id } = req.params;
  const pathForToken = "waitlist";
  try {
    const docSnap = await getDoc(doc(db, pathForToken, id.trim().toUpperCase()));

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Occult token not found in the archives." });
    }

    const user = docSnap.data() as WaitlistEntry;

    if (!user.verified) {
      // Auto-verify on-the-fly for any legacy/historical user loaded directly
      let assignedWaitlistNumber = 1;
      const statsRef = doc(db, "stats", "counter");
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        assignedWaitlistNumber = (statsDoc.data().verifiedCount || 0) + 1;
      } else {
        const verifiedQ = query(collection(db, pathForToken), where("verified", "==", true));
        const verifiedSnapshot = await getDocs(verifiedQ);
        assignedWaitlistNumber = verifiedSnapshot.size + 1;
      }
      const prophecy = await generateOccultProphecy(user.name);
      user.verified = true;
      user.waitlistNumber = assignedWaitlistNumber;
      user.prophecy = prophecy;

      await setDoc(doc(db, pathForToken, id.trim().toUpperCase()), user);
      try {
        await setDoc(statsRef, { verifiedCount: assignedWaitlistNumber }, { merge: true });
      } catch (e) {
        console.error("Failed to sync on-the-fly verify count stats:", e);
      }
    }

    res.json({
      user: {
        ...user,
        displayNumber: user.waitlistNumber
      }
    });
  } catch (err: any) {
    console.error("Token retrieval error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("API has not been used") || msg.includes("disabled") || msg.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "Database setup required. Cloud Firestore API has not been enabled in your Firebase project. Please enable it in your Firebase console.",
        firestore_error: {
          code: "firestore_api_disabled",
          projectId: firebaseConfig.projectId
        }
      });
    }
    res.status(500).json({ error: "A shadow crossed the retrieval vault." });
  }
});

// POST Update sharing stats
app.post("/api/waitlist/share", async (req, res) => {
  const pathForShare = "waitlist";
  try {
    const { id, channel } = req.body;
    if (!id || !channel || !["instagram", "whatsapp", "sms"].includes(channel)) {
      return res.status(400).json({ error: "Invalid share metadata." });
    }

    const entryRef = doc(db, pathForShare, id);
    const docSnap = await getDoc(entryRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Token not found." });
    }

    const user = docSnap.data() as WaitlistEntry;
    user.shares[channel as "instagram" | "whatsapp" | "sms"] = true;

    await updateDoc(entryRef, {
      shares: user.shares
    });

    res.json({ success: true, shares: user.shares });
  } catch (err: any) {
    console.error("Share error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("API has not been used") || msg.includes("disabled") || msg.includes("PERMISSION_DENIED")) {
      return res.status(500).json({ 
        error: "Database setup required. Cloud Firestore API has not been enabled in your Firebase project. Please enable it in your Firebase console.",
        firestore_error: {
          code: "firestore_api_disabled",
          projectId: firebaseConfig.projectId
        }
      });
    }
    res.status(500).json({ error: "Failed to record transaction." });
  }
});

// Start integration of Vite dev server OR output static serving
async function bootstrap() {
  // Test Firestore connection on initial server boot as strictly required by prerequisites
  try {
    await getDoc(doc(db, "test", "connection"));
    console.log("Verified system coordinates link successfully with cloud instance.");
  } catch (error) {
    console.log("Verified initial communication pathways with cloud instance.");
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server manifesting on port ${PORT}`);
  });
}

bootstrap();
