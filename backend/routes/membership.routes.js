import express from "express";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { config } from "../config/env.js";
import createRateLimiter from "../middlewares/rateLimiter.js";
import upload from "../middlewares/upload.js";
import path from "path";
import { promises as fsPromises } from "fs";

const router = express.Router();

// Rate limiters
const paymentRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requêtes par 15 minutes
const verifyRateLimiter = createRateLimiter(5 * 60 * 1000, 10); // 10 requêtes par 5 minutes

// Prix de la cotisation
const MEMBERSHIP_PRICES = {
  EUR: 16,
  USD: 18,
  XAF: 10000, // ~15 EUR
};

// -----------------------------
// NEW: soumission manuelle (formulaire + preuve)
// -----------------------------
router.post(
  "/submit",
  authMiddleware,
  paymentRateLimiter,
  upload.fields([
    { name: "proof", maxCount: 1 },
    { name: "form", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { currency, category, submissionMethod } = req.body;

      const baseDir = path.join(
        process.cwd(),
        "backend",
        "uploads",
        "memberships",
      );
      const proofsDir = path.join(baseDir, "proofs");
      const formsDir = path.join(baseDir, "forms");
      await fsPromises.mkdir(proofsDir, { recursive: true });
      await fsPromises.mkdir(formsDir, { recursive: true });

      await Membership.deleteMany({
        user: userId,
        submissionStatus: "pending",
      });

      const paymentNumber = await Membership.generatePaymentNumber();
      const membership = new Membership({
        user: userId,
        category: category || "standard",
        amount: req.body.amount || null,
        currency: currency || "XAF",
        submissionStatus: "pending",
        submissionMethod: submissionMethod || "bank_transfer",
        paymentNumber,
      });

      if (req.files && req.files.proof && req.files.proof[0]) {
        const adminEmail = config.adminEmail || "admin@aegc.local";
        return res.status(400).json({
          success: false,
          message: `La preuve de paiement doit être envoyée par email à ${adminEmail}. Ne pas téléverser la preuve via la plateforme.`,
        });
      }

      if (
        submissionMethod === "online" ||
        req.body.submissionMethod === "online"
      ) {
        if (req.body.formData) {
          try {
            membership.membershipFormData =
              typeof req.body.formData === "string"
                ? JSON.parse(req.body.formData)
                : req.body.formData;
          } catch (e) {
            membership.membershipFormData = req.body.formData;
          }
        }

        if (req.files && req.files.form && req.files.form[0]) {
          const f = req.files.form[0];
          const filename = `${Date.now()}_${f.originalname}`.replace(
            /\s+/g,
            "_",
          );
          const dest = path.join(formsDir, filename);
          await fsPromises.writeFile(dest, f.buffer);
          membership.membershipFormUrl = `/uploads/memberships/forms/${filename}`;
        }
      } else {
        membership.notes = `Utilisateur informé d'envoyer preuve et formulaire par email à ${config.adminEmail || "admin@aegc.local"}`;
        membership.submissionMethod = "email";
      }

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
      res.status(500).json({
        message: "Erreur serveur lors de la soumission.",
        error: error.message,
      });
    }
  },
);

// @route   POST /api/membership/create-checkout-session
// @desc    Endpoint legacy désactivé
// @access  Private
router.post(
  "/create-checkout-session",
  authMiddleware,
  paymentRateLimiter,
  async (req, res) => {
    // Deprecated: manual submission flow is used instead
    return res.status(410).json({
      message:
        "Deprecated: payment integrations removed. Use POST /api/membership/submit",
    });
  },
);

// @route   GET /api/membership/my-membership
// @desc    Récupérer le membership actuel de l'utilisateur
// @access  Private
router.post("/verify-session", verifyRateLimiter, async (req, res) => {
  return res.status(410).json({
    message:
      "Deprecated: payment integrations removed. Use admin approval flow.",
  });
});

// @route   POST /api/membership/create-notchpay-payment
// @desc    Endpoint legacy désactivé
// @access  Private
router.post(
  "/create-notchpay-payment",
  authMiddleware,
  paymentRateLimiter,
  async (req, res) => {
    // Deprecated: manual submission flow is used instead
    return res.status(410).json({
      message:
        "Deprecated: payment integrations removed. Use POST /api/membership/submit",
    });
  },
);

// @route   POST /api/membership/verify-notchpay
// @desc    Endpoint legacy désactivé
// @access  Public
router.post("/verify-notchpay", verifyRateLimiter, async (req, res) => {
  return res.status(410).json({
    message:
      "Deprecated: payment integrations removed. Use admin approval flow.",
  });
});

// @route   POST /api/membership/notchpay-webhook
// @desc    Endpoint legacy désactivé
// @access  Public (mais vérifié par signature)
router.post("/notchpay-webhook", express.json(), async (req, res) => {
  return res
    .status(410)
    .json({ message: "Deprecated: payment integrations removed." });
});

// @route   POST /api/membership/webhook
// @desc    Endpoint legacy désactivé
// @access  Public
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    return res
      .status(410)
      .json({ message: "Deprecated: payment integrations removed." });
  },
);

// @route   GET /api/membership/success (DEPRECATED - utiliser verify-session)
// @desc    Page de confirmation après paiement
// @access  Public
router.get("/success", async (req, res) => {
  res.json({ message: "Utilisez POST /verify-session à la place" });
});

// @route   GET /api/membership/payment-info
// @desc    Retourne les coordonnées de paiement manuel (IBAN, mobile money)
// @access  Public
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

// @route   GET /api/membership/my-membership
// @desc    Récupérer la soumission/membership la plus récente de l'utilisateur (private)
// @access  Private
router.get("/my-membership", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("currentMembership").lean();

    if (!user) {
      return res.json({ success: true, membership: null, isActive: false });
    }

    if (user.currentMembership) {
      const currentMembership = await Membership.findById(
        user.currentMembership,
      ).lean();
      if (currentMembership) {
        const currentIsActive =
          currentMembership.submissionStatus === "approved" &&
          currentMembership.endDate &&
          new Date(currentMembership.endDate) > new Date();

        return res.json({
          success: true,
          membership: currentMembership,
          isActive: currentIsActive,
        });
      }
    }

    const latestApprovedMembership = await Membership.findOne({
      user: userId,
      submissionStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (latestApprovedMembership) {
      const isActive =
        latestApprovedMembership.endDate &&
        new Date(latestApprovedMembership.endDate) > new Date();

      return res.json({
        success: true,
        membership: latestApprovedMembership,
        isActive,
      });
    }

    const latestPendingMembership = await Membership.findOne({
      user: userId,
      submissionStatus: "pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestPendingMembership) {
      return res.json({ success: true, membership: null, isActive: false });
    }

    return res.json({
      success: true,
      membership: latestPendingMembership,
      isActive: false,
    });
  } catch (err) {
    console.error("Erreur récupération my-membership:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
