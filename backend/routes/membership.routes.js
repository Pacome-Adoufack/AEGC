import express from "express";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { config } from "../config/env.js";
import createRateLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();

const submitRateLimiter = createRateLimiter(15 * 60 * 1000, 5);

// POST /api/membership/submit
router.post("/submit", authMiddleware, submitRateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency, category } = req.body;

    // Supprimer les éventuelles soumissions en attente existantes
    await Membership.deleteMany({ user: userId, submissionStatus: "pending" });

    const paymentNumber = await Membership.generatePaymentNumber();

    const membership = new Membership({
      user: userId,
      category: category || "standard",
      currency: currency || "XAF",
      submissionStatus: "pending",
      submissionMethod: "email",
      paymentNumber,
      notes: `Utilisateur informé d'envoyer preuve et formulaire par email à ${config.adminEmail || "admin@aegc.local"}`,
    });

    await membership.save();

    await User.findByIdAndUpdate(userId, {
      currentMembership: membership._id,
      membershipStatus: "none",
    });

    res.json({
      success: true,
      message: "Soumission reçue. En attente de validation.",
      membershipId: membership._id,
    });
  } catch (error) {
    console.error("Erreur soumission membership:", error);
    res.status(500).json({ message: "Erreur serveur lors de la soumission.", error: error.message });
  }
});

// GET /api/membership/payment-info
router.get("/payment-info", async (req, res) => {
  try {
    res.json({
      iban: config.paymentIban || null,
      bankAccount: config.paymentBankAccount || null,
      orangeNumber: config.paymentOrangeNumber || null,
      mtnNumber: config.paymentMtnNumber || null,
      adminEmail: config.adminEmail || null,
    });
  } catch (err) {
    console.error("Erreur récupération payment-info:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/membership/my-membership
router.get("/my-membership", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("currentMembership").lean();

    if (!user) return res.json({ success: true, membership: null, isActive: false });

    if (user.currentMembership) {
      const current = await Membership.findById(user.currentMembership).lean();
      if (current) {
        const isActive =
          current.submissionStatus === "approved" &&
          current.endDate &&
          new Date(current.endDate) > new Date();
        return res.json({ success: true, membership: current, isActive });
      }
    }

    const latestApproved = await Membership.findOne({ user: userId, submissionStatus: "approved" })
      .sort({ createdAt: -1 })
      .lean();

    if (latestApproved) {
      const isActive = latestApproved.endDate && new Date(latestApproved.endDate) > new Date();
      return res.json({ success: true, membership: latestApproved, isActive });
    }

    const latestPending = await Membership.findOne({ user: userId, submissionStatus: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, membership: latestPending || null, isActive: false });
  } catch (err) {
    console.error("Erreur récupération my-membership:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
