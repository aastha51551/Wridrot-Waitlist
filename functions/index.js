const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());


// ============================================================
// HEALTH CHECK
// GET /health
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    project: process.env.GCLOUD_PROJECT,
  });
});


// ============================================================
// WAITLIST COUNT
// GET /waitlist/count
// ============================================================

app.get("/waitlist/count", async (req, res) => {
  try {
    const snapshot = await db
      .collection("waitlist")
      .where("verified", "==", true)
      .count()
      .get();

    const count = snapshot.data().count;

    res.status(200).json({
      count,
    });
  } catch (error) {
    console.error("Error getting waitlist count:", error);

    res.status(200).json({
      count: 0,
      firestore_error: {
        code: error.code || "unknown",
        message: error.message || "Unknown Firestore error",
      },
    });
  }
});


// ============================================================
// GET USER BY ID
// GET /waitlist/token/:id
// ============================================================

app.get("/waitlist/token/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "Missing user ID",
      });
    }

    const snapshot = await db
      .collection("waitlist")
      .where("id", "==", id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Do NOT send verificationToken to the browser.
    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      waitlistNumber: data.waitlistNumber,
      createdAt: data.createdAt,
      prophecy: data.prophecy,
      verified: data.verified,
      shares: data.shares || {
        instagram: false,
        whatsapp: false,
        sms: false,
      },
    };

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error getting user:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});


// ============================================================
// RECORD SHARE
// POST /waitlist/share
// ============================================================

app.post("/waitlist/share", async (req, res) => {
  try {
    const { id, channel } = req.body;

    const allowedChannels = [
      "instagram",
      "whatsapp",
      "sms",
    ];

    if (!id) {
      return res.status(400).json({
        error: "Missing user ID",
      });
    }

    if (!allowedChannels.includes(channel)) {
      return res.status(400).json({
        error: "Invalid share channel",
      });
    }

    const snapshot = await db
      .collection("waitlist")
      .where("id", "==", id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const shares = {
      instagram: false,
      whatsapp: false,
      sms: false,
      ...(data.shares || {}),
    };

    shares[channel] = true;

    await doc.ref.update({
      shares,
    });

    res.status(200).json({
      shares,
    });
  } catch (error) {
    console.error("Error recording share:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});


// ============================================================
// EXPORT API
// ============================================================

exports.api = onRequest(app);