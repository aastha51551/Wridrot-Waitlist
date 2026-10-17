const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

/* =========================================================
   FIREBASE ADMIN
   ========================================================= */

if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id ||
      "forbidden-archives-waitlist",
  });
}

const db = admin.firestore();

/* =========================================================
   HELPERS
   ========================================================= */

async function generateOccultProphecy(name) {
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
    `A candle flutters and dies in the dark library, signaling the entry of the name '${name}' into the Book of the Lost.`,
  ];

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % customTones.length;

  return customTones[index];
}

function generateTokenId() {
  const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";

  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return `WM-${result}`;
}

function generateVerificationToken() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < 16; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

function getEmailDocId(email) {
  return email
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/* =========================================================
   VERCEL PATH NORMALIZATION
   ========================================================= */

/*
  Vercel exposes this function under /api.

  This allows our Express routes to work whether Vercel
  passes /api/... or only the part after /api.
*/

app.use((req, res, next) => {
  if (
    req.url === "/api" ||
    req.url.startsWith("/api/")
  ) {
    req.url = req.url.slice(4) || "/";
  }

  next();
});

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/health", (req, res) => {
  res.json({
    status: "alive",
    message:
      "Forbidden Archives server is running in the shadows connected to the cloud",
  });
});

/* =========================================================
   WAITLIST COUNT
   ========================================================= */

app.get("/waitlist/count", async (req, res) => {
  try {
    const statsRef = db.collection("stats").doc("counter");
    const statsDoc = await statsRef.get();

    if (statsDoc.exists) {
      return res.json({
        count: statsDoc.data().verifiedCount || 0,
      });
    }

    const snapshot = await db
      .collection("waitlist")
      .where("verified", "==", true)
      .get();

    const count = snapshot.size;

    await statsRef.set({
      verifiedCount: count,
    });

    return res.json({ count });
  } catch (error) {
    console.error("Waitlist count error:", error);

    return res.status(500).json({
      error: "Failed to read cloud statistics.",
      firestore_error: {
        code: "firestore_error",
        message:
          error instanceof Error
            ? error.message
            : String(error),
        projectId:
          process.env.FIREBASE_PROJECT_ID ||
          "forbidden-archives-waitlist",
      },
    });
  }
});

/* =========================================================
   EMAIL VERIFICATION
   ========================================================= */

app.get("/waitlist/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const tokenDoc = await db
      .collection("verification_tokens")
      .doc(token)
      .get();

    if (!tokenDoc.exists) {
      return res.status(400).send(`
        <html>
          <head>
            <style>
              body {
                background: #0c0505;
                color: #ef4444;
                font-family: monospace;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }

              .card {
                border: 2px solid #b91c1c;
                padding: 40px;
                border-radius: 12px;
                background: #000;
                box-shadow: 0 0 20px rgba(185, 28, 28, 0.4);
                max-width: 450px;
              }

              h1 {
                font-family: Georgia, serif;
                margin-bottom: 20px;
              }

              p {
                color: #ccc;
                line-height: 1.6;
              }

              a {
                color: #f43f5e;
                font-weight: bold;
                border: 1px dashed #f43f5e;
                padding: 8px 16px;
                display: inline-block;
                margin-top: 20px;
                text-decoration: none;
              }
            </style>
          </head>

          <body>
            <div class="card">
              <h1>SEAL EXPIRED OR BROKEN</h1>

              <p>
                The verification coordinate token you have provided
                is invalid or has expired in the ritual fires.
              </p>

              <a href="/">Return to Vault Portal</a>
            </div>
          </body>
        </html>
      `);
    }

    const { tokenId } = tokenDoc.data();

    const entryRef = db
      .collection("waitlist")
      .doc(tokenId);

    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      return res.status(400).send(`
        <html>
          <head>
            <style>
              body {
                background: #0c0505;
                color: #ef4444;
                font-family: monospace;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }

              .card {
                border: 2px solid #b91c1c;
                padding: 40px;
                border-radius: 12px;
                background: #000;
                max-width: 450px;
              }

              p {
                color: #ccc;
                line-height: 1.6;
              }

              a {
                color: #f43f5e;
                font-weight: bold;
                border: 1px dashed #f43f5e;
                padding: 8px 16px;
                display: inline-block;
                margin-top: 20px;
                text-decoration: none;
              }
            </style>
          </head>

          <body>
            <div class="card">
              <h1>ENTRY ORPHANED</h1>

              <p>
                The registered entry for this token could not
                be found in our archives.
              </p>

              <a href="/">Return to Vault Portal</a>
            </div>
          </body>
        </html>
      `);
    }

    const entry = entryDoc.data();

    if (entry.verified) {
      return res.redirect(
        `/?token=${entry.id}&verified=true`
      );
    }

    const statsRef = db
      .collection("stats")
      .doc("counter");

    const statsDoc = await statsRef.get();

    let assignedWaitlistNumber = 1;

    if (statsDoc.exists) {
      assignedWaitlistNumber =
        (statsDoc.data().verifiedCount || 0) + 1;
    } else {
      const verifiedSnapshot = await db
        .collection("waitlist")
        .where("verified", "==", true)
        .get();

      assignedWaitlistNumber =
        verifiedSnapshot.size + 1;
    }

    const prophecy =
      await generateOccultProphecy(entry.name);

    await entryRef.update({
      verified: true,
      waitlistNumber: assignedWaitlistNumber,
      prophecy,
    });

    await statsRef.set(
      {
        verifiedCount: assignedWaitlistNumber,
      },
      { merge: true }
    );

    return res.redirect(
      `/?token=${entry.id}&just_verified=true`
    );
  } catch (error) {
    console.error("Verification error:", error);

    return res
      .status(500)
      .send(
        "A shadow has crossed our server during verification."
      );
  }
});

/* =========================================================
   REGISTER USER
   ========================================================= */

app.post("/waitlist", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return res.status(400).json({
        error:
          "The Dark Oracle demands your name.",
      });
    }

    if (
      !email ||
      typeof email !== "string" ||
      !email.includes("@")
    ) {
      return res.status(400).json({
        error:
          "Provide a valid realm of contact (email).",
      });
    }

    const trimmedName =
      name.trim().slice(0, 50);

    const trimmedEmail =
      email.trim().toLowerCase();

    const emailDocId =
      getEmailDocId(trimmedEmail);

    /* Duplicate email check */

    const emailLookupDoc = await db
      .collection("emails")
      .doc(emailDocId)
      .get();

    if (emailLookupDoc.exists) {
      return res.status(400).json({
        error:
          "This email has already summoned an entry pass. Duplicate covenants are strictly forbidden in the Forbidden Archives.",
      });
    }

    /* Generate unique ID */

    let newTokenId = generateTokenId();

    let idExists = true;
    let attempts = 0;

    while (idExists && attempts < 5) {
      const idCheckDoc = await db
        .collection("waitlist")
        .doc(newTokenId)
        .get();

      if (!idCheckDoc.exists) {
        idExists = false;
      } else {
        newTokenId = generateTokenId();
      }

      attempts++;
    }

    if (idExists) {
      return res.status(500).json({
        error:
          "The archives failed to generate a unique entry seal. Please try again.",
      });
    }

    const verificationToken =
      generateVerificationToken();

    /* Assign waitlist number */

    const statsRef = db
      .collection("stats")
      .doc("counter");

    const statsDoc = await statsRef.get();

    let assignedWaitlistNumber = 1;

    if (statsDoc.exists) {
      assignedWaitlistNumber =
        (statsDoc.data().verifiedCount || 0) + 1;
    } else {
      const verifiedSnapshot = await db
        .collection("waitlist")
        .where("verified", "==", true)
        .get();

      assignedWaitlistNumber =
        verifiedSnapshot.size + 1;
    }

    /* Generate prophecy */

    const prophecy =
      await generateOccultProphecy(trimmedName);

    const newEntry = {
      id: newTokenId,
      name: trimmedName,
      email: trimmedEmail,
      waitlistNumber: assignedWaitlistNumber,
      createdAt: new Date().toISOString(),
      prophecy,
      verified: true,
      verificationToken,
      shares: {
        instagram: false,
        whatsapp: false,
        sms: false,
      },
    };

    console.log(
      "[REGISTRATION] Saving waitlist entry...",
      JSON.stringify(newEntry)
    );

    /* Save waitlist entry */

    await db
      .collection("waitlist")
      .doc(newTokenId)
      .set(newEntry);

    /* Save email lookup */

    await db
      .collection("emails")
      .doc(emailDocId)
      .set({
        tokenId: newTokenId,
      });

    /* Save verification token */

    await db
      .collection("verification_tokens")
      .doc(verificationToken)
      .set({
        tokenId: newTokenId,
      });

    /* Update live counter */

    await statsRef.set(
      {
        verifiedCount: assignedWaitlistNumber,
      },
      { merge: true }
    );

    console.log(
      "[REGISTRATION] Registration complete:",
      newTokenId
    );

    return res.status(201).json({
      verified: true,
      message:
        "Your covenant space is bound.",
      user: {
        ...newEntry,
        displayNumber:
          assignedWaitlistNumber,
      },
    });
  } catch (error) {
    console.error(
      "Registry error:",
      error
    );

    return res.status(500).json({
      error:
        "Dark forces disrupted your registration.",
    });
  }
});

/* =========================================================
   GET USER BY TOKEN ID
   ========================================================= */

app.get(
  "/waitlist/token/:id",
  async (req, res) => {
    const id = req.params.id
      .trim()
      .toUpperCase();

    try {
      const entryRef = db
        .collection("waitlist")
        .doc(id);

      const docSnap =
        await entryRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({
          error:
            "Occult token not found in the archives.",
        });
      }

      const user = docSnap.data();

      /* Legacy auto-verification */

      if (!user.verified) {
        const statsRef = db
          .collection("stats")
          .doc("counter");

        const statsDoc =
          await statsRef.get();

        let assignedWaitlistNumber = 1;

        if (statsDoc.exists) {
          assignedWaitlistNumber =
            (statsDoc.data().verifiedCount || 0) +
            1;
        } else {
          const verifiedSnapshot =
            await db
              .collection("waitlist")
              .where(
                "verified",
                "==",
                true
              )
              .get();

          assignedWaitlistNumber =
            verifiedSnapshot.size + 1;
        }

        const prophecy =
          await generateOccultProphecy(
            user.name
          );

        user.verified = true;
        user.waitlistNumber =
          assignedWaitlistNumber;
        user.prophecy = prophecy;

        await entryRef.set(user);

        await statsRef.set(
          {
            verifiedCount:
              assignedWaitlistNumber,
          },
          { merge: true }
        );
      }

      return res.json({
        user: {
          ...user,
          displayNumber:
            user.waitlistNumber,
        },
      });
    } catch (error) {
      console.error(
        "Token retrieval error:",
        error
      );

      return res.status(500).json({
        error:
          "A shadow crossed the retrieval vault.",
      });
    }
  }
);

/* =========================================================
   SHARE
   ========================================================= */

app.post(
  "/waitlist/share",
  async (req, res) => {
    try {
      const { id, channel } = req.body;

      if (
        !id ||
        !channel ||
        ![
          "instagram",
          "whatsapp",
          "sms",
        ].includes(channel)
      ) {
        return res.status(400).json({
          error:
            "Invalid share metadata.",
        });
      }

      const entryRef = db
        .collection("waitlist")
        .doc(id.trim().toUpperCase());

      const docSnap =
        await entryRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({
          error:
            "Token not found.",
        });
      }

      const user = docSnap.data();

      const shares = {
        ...(user.shares || {}),
        [channel]: true,
      };

      await entryRef.update({
        shares,
      });

      return res.json({
        success: true,
        shares,
      });
    } catch (error) {
      console.error(
        "Share error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to record transaction.",
      });
    }
  }
);

/* =========================================================
   EXPORT FOR VERCEL
   ========================================================= */

module.exports = app;