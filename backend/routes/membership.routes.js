import express from "express";
import Stripe from "stripe";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { config } from "../config/env.js";
import createRateLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();

// Initialiser Stripe avec la configuration
const stripe = new Stripe(config.stripeSecretKey);

// Rate limiters
const paymentRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requêtes par 15 minutes
const verifyRateLimiter = createRateLimiter(5 * 60 * 1000, 10); // 10 requêtes par 5 minutes

// Prix de la cotisation
const MEMBERSHIP_PRICES = {
  EUR: 16,
  USD: 18,
  XAF: 10000, // ~15 EUR
};

// @route   POST /api/membership/create-checkout-session
// @desc    Créer une session de paiement Stripe
// @access  Private
router.post(
  "/create-checkout-session",
  authMiddleware,
  paymentRateLimiter,
  async (req, res) => {
    try {
      const { currency } = req.body; // 'EUR' ou 'USD'

      if (!currency || !["EUR", "USD", "XAF"].includes(currency)) {
        return res
          .status(400)
          .json({ message: "Devise invalide. Choisissez EUR, USD ou XAF." });
      }

      const amount = MEMBERSHIP_PRICES[currency];
      const userId = req.user.id;

      // Vérifier si l'utilisateur a déjà un membership actif
      const existingMembership = await Membership.findOne({
        user: userId,
        paymentStatus: "paid",
      });

      if (existingMembership && existingMembership.isActive()) {
        return res.status(400).json({
          message: "Vous avez déjà une cotisation active.",
          membership: existingMembership,
        });
      }

      // Supprimer les anciens memberships en attente de cet utilisateur pour éviter les doublons
      await Membership.deleteMany({
        user: userId,
        paymentStatus: "pending",
      });

      // Créer un membership en attente
      const paymentNumber = await Membership.generatePaymentNumber();
      const membership = new Membership({
        user: userId,
        amount,
        currency,
        paymentStatus: "pending",
        paymentMethod: "stripe",
        paymentNumber,
      });

      await membership.save();

      // Créer session Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: "Cotisation Annuelle AEGC",
                description: "Adhésion pour 1 an",
              },
              unit_amount: amount * 100, // montant en centimes
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${config.frontendUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontendUrl}/informations%20personnelles`,
        client_reference_id: membership._id.toString(),
        metadata: {
          membershipId: membership._id.toString(),
          userId: userId.toString(),
        },
      });

      membership.stripeSessionId = session.id;
      await membership.save();

      res.json({
        sessionId: session.id,
        url: session.url,
        membershipId: membership._id,
      });
    } catch (error) {
      console.error("Erreur création session Stripe:", error);
      res
        .status(500)
        .json({ message: "Erreur serveur lors de la création de la session." });
    }
  },
);

// @route   GET /api/membership/my-membership
// @desc    Récupérer le membership actuel de l'utilisateur
// @access  Private
router.get("/my-membership", authMiddleware, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      user: req.user.id,
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    if (!membership) {
      return res.json({ membership: null, status: "none" });
    }

    const isActive = membership.isActive();

    // Mettre à jour le statut si expiré
    if (!isActive && membership.paymentStatus === "paid") {
      membership.paymentStatus = "expired";
      await membership.save();

      await User.findByIdAndUpdate(req.user.id, {
        membershipStatus: "expired",
      });
    }

    res.json({
      membership,
      status: isActive ? "active" : "expired",
      isActive,
    });
  } catch (error) {
    console.error("Erreur récupération membership:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// @route   POST /api/membership/verify-session
// @desc    Vérifier et activer le membership après paiement Stripe
// @access  Public (mais sécurisé par session_id Stripe)
router.post("/verify-session", verifyRateLimiter, async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: "Session ID manquant" });
    }

    // Récupérer la session depuis Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ message: "Session non trouvée" });
    }

    // Vérifier que le paiement est bien réussi
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        message: "Paiement non confirmé",
        status: session.payment_status,
      });
    }

    // Récupérer le membership via les metadata
    const membershipId =
      session.metadata?.membershipId || session.client_reference_id;

    if (!membershipId) {
      return res
        .status(400)
        .json({ message: "Membership ID non trouvé dans la session" });
    }

    const membership = await Membership.findById(membershipId);

    if (!membership) {
      return res.status(404).json({ message: "Membership non trouvé" });
    }

    // Valider que le montant payé correspond au montant attendu
    const expectedAmount = MEMBERSHIP_PRICES[membership.currency] * 100;
    if (session.amount_total !== expectedAmount) {
      console.error(
        `⚠️ Montant invalide: reçu ${session.amount_total}, attendu ${expectedAmount}`,
      );
      return res.status(400).json({
        message: "Montant de paiement invalide",
        expected: expectedAmount,
        received: session.amount_total,
      });
    }

    // Si déjà activé, retourner simplement les infos
    if (membership.paymentStatus === "paid") {
      return res.json({
        success: true,
        message: "Membership déjà activé",
        membership,
        alreadyActivated: true,
      });
    }

    // Activer le membership
    membership.paymentStatus = "paid";
    membership.startDate = new Date();
    membership.calculateEndDate();
    membership.stripePaymentIntentId = session.payment_intent;
    membership.stripeSessionId = session_id;
    await membership.save();

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(membership.user, {
      membershipStatus: "active",
      currentMembership: membershipId,
    });

    res.json({
      success: true,
      message: "Membership activé avec succès!",
      membership,
    });
  } catch (error) {
    console.error("Erreur vérification session:", error);
    res.status(500).json({
      message: "Erreur lors de la vérification du paiement",
      error: error.message,
    });
  }
});

// @route   POST /api/membership/create-notchpay-payment
// @desc    Créer un paiement Notch Pay (Mobile Money)
// @access  Private
router.post(
  "/create-notchpay-payment",
  authMiddleware,
  paymentRateLimiter,
  async (req, res) => {
    try {
      const { currency, phone, paymentChannel } = req.body; // paymentChannel: 'orange_money' ou 'mtn_momo'

      if (currency !== "XAF") {
        return res
          .status(400)
          .json({ message: "Notch Pay supporte uniquement XAF." });
      }

      if (!phone || !paymentChannel) {
        return res
          .status(400)
          .json({
            message: "Numéro de téléphone et canal de paiement requis.",
          });
      }

      if (!["orange_money", "mtn_momo"].includes(paymentChannel)) {
        return res.status(400).json({ message: "Canal de paiement invalide." });
      }

      const amount = MEMBERSHIP_PRICES.XAF;
      const userId = req.user.id;

      // Vérifier si l'utilisateur a déjà un membership actif
      const existingMembership = await Membership.findOne({
        user: userId,
        paymentStatus: "paid",
      });

      if (existingMembership && existingMembership.isActive()) {
        return res.status(400).json({
          message: "Vous avez déjà une cotisation active.",
          membership: existingMembership,
        });
      }

      // Supprimer les anciens memberships en attente de cet utilisateur pour éviter les doublons
      await Membership.deleteMany({
        user: userId,
        paymentStatus: "pending",
      });

      // Créer un membership en attente
      const paymentNumber = await Membership.generatePaymentNumber();
      const membership = new Membership({
        user: userId,
        amount,
        currency: "XAF",
        paymentStatus: "pending",
        paymentMethod: paymentChannel,
        mobileMoneyPhone: phone,
        paymentNumber,
      });

      await membership.save();

      // Initialiser le paiement avec Notch Pay
      let notchpayData;
      try {
        const notchpayResponse = await fetch(
          "https://api.notchpay.co/payments/initialize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: config.notchpayPrivateKey,
            },
            body: JSON.stringify({
              amount: amount,
              currency: "XAF",
              description: "Cotisation Annuelle AEGC",
              email: req.user.email,
              callback: `${config.frontendUrl}/membership/success`,
              reference: membership._id.toString(),
              phone: phone,
              channel: paymentChannel,
            }),
          },
        );

        if (!notchpayResponse.ok) {
          const errorText = await notchpayResponse.text();
          console.error(
            "❌ Échec initialisation Notch Pay:",
            notchpayResponse.status,
            errorText,
          );
          throw new Error("Impossible d'initialiser le paiement Notch Pay");
        }

        notchpayData = await notchpayResponse.json();

        if (process.env.NODE_ENV !== "production") {
          console.log("📱 Réponse initialisation Notch Pay:", {
            ok: notchpayResponse.ok,
            status: notchpayResponse.status,
            reference: notchpayData.transaction?.reference,
          });
        }
      } catch (fetchError) {
        console.error(
          "❌ Erreur lors de la requête Notch Pay:",
          fetchError.message,
        );
        throw new Error("Erreur de communication avec le service de paiement");
      }

      if (!notchpayData.transaction) {
        console.error("❌ Échec initialisation:", notchpayData);
        throw new Error(
          notchpayData.message || "Échec de l'initialisation du paiement",
        );
      }

      // Sauvegarder la référence Notch Pay
      membership.notchpayReference = notchpayData.transaction.reference;
      await membership.save();

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Paiement initialisé:", {
          reference: notchpayData.transaction.reference,
          membershipId: membership._id,
        });
      }

      res.json({
        success: true,
        reference: notchpayData.transaction.reference,
        authorizationUrl: notchpayData.authorization_url,
        membershipId: membership._id,
        message:
          "Paiement initialisé. Suivez les instructions sur votre téléphone.",
      });
    } catch (error) {
      console.error("❌ Erreur création paiement Notch Pay:", error.message);
      res.status(500).json({
        message: "Erreur serveur lors de la création du paiement.",
      });
    }
  },
);

// @route   POST /api/membership/verify-notchpay
// @desc    Vérifier et activer le membership après paiement Notch Pay
// @access  Public
router.post("/verify-notchpay", verifyRateLimiter, async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res
        .status(400)
        .json({ message: "Référence de transaction manquante" });
    }

    // Vérifier le statut du paiement avec Notch Pay
    let verifyData;
    try {
      const verifyResponse = await fetch(
        `https://api.notchpay.co/payments/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: config.notchpayPrivateKey,
          },
        },
      );

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error(
          "❌ Erreur API Notch Pay:",
          verifyResponse.status,
          errorText,
        );
        return res.status(400).json({
          message: "Erreur lors de la vérification du paiement",
        });
      }

      verifyData = await verifyResponse.json();

      if (process.env.NODE_ENV !== "production") {
        console.log("🔍 Réponse Notch Pay:", {
          ok: verifyResponse.ok,
          status: verifyResponse.status,
          transactionStatus: verifyData.transaction?.status,
        });
      }
    } catch (fetchError) {
      console.error("❌ Erreur requête vérification:", fetchError.message);
      return res.status(500).json({
        message: "Erreur de communication avec le service de paiement",
      });
    }

    // Vérifier que le paiement est bien réussi
    if (verifyData.transaction.status !== "complete") {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "⏳ Paiement pas encore complet:",
          verifyData.transaction.status,
        );
      }
      return res.status(400).json({
        message: "Paiement non confirmé",
        status: verifyData.transaction.status,
      });
    }

    // Récupérer le membership via merchant_reference (notre ID)
    const membershipId = verifyData.transaction.merchant_reference;
    if (process.env.NODE_ENV !== "production") {
      console.log("🔎 Recherche membership:", membershipId);
    }
    const membership = await Membership.findById(membershipId);

    if (!membership) {
      console.error("❌ Membership non trouvé:", membershipId);
      return res.status(404).json({ message: "Membership non trouvé" });
    }

    // Si déjà activé, retourner simplement les infos
    if (membership.paymentStatus === "paid") {
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Membership déjà activé");
      }
      return res.json({
        success: true,
        message: "Membership déjà activé",
        membership,
        alreadyActivated: true,
      });
    }

    // Activer le membership
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Activation du membership...");
    }
    membership.paymentStatus = "paid";
    membership.startDate = new Date();
    membership.calculateEndDate();
    membership.notchpayTransactionId = verifyData.transaction.id;
    await membership.save();

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(membership.user, {
      membershipStatus: "active",
      currentMembership: membershipId,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("🎉 Membership activé avec succès!");
    }
    res.json({
      success: true,
      message: "Membership activé avec succès!",
      membership,
    });
  } catch (error) {
    console.error("❌ Erreur vérification Notch Pay:", error.message);
    res.status(500).json({
      message: "Erreur lors de la vérification du paiement",
    });
  }
});

// @route   POST /api/membership/notchpay-webhook
// @desc    Webhook Notch Pay pour confirmation de paiement
// @access  Public (mais vérifié par signature)
router.post("/notchpay-webhook", express.json(), async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers["x-notchpay-signature"];

    // TODO: Vérifier la signature Notch Pay en production
    // const isValid = verifyNotchPaySignature(event, signature, config.notchpayPrivateKey);
    // if (!isValid) {
    //   console.error("❌ Signature webhook invalide");
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Vérifier que c'est un événement de paiement complété
    if (event.event !== "payment.complete") {
      return res.json({ received: true });
    }

    const reference = event.transaction.reference;
    const membership = await Membership.findById(reference);

    if (!membership) {
      console.error(`❌ Membership non trouvé: ${reference}`);
      return res.status(404).json({ error: "Membership not found" });
    }

    if (membership.paymentStatus !== "paid") {
      // Valider le montant
      const expectedAmount = MEMBERSHIP_PRICES.XAF;
      if (event.transaction.amount !== expectedAmount) {
        console.error(
          `⚠️ Montant webhook invalide: reçu ${event.transaction.amount}, attendu ${expectedAmount}`,
        );
        return res.status(400).json({ error: "Invalid amount" });
      }

      membership.paymentStatus = "paid";
      membership.startDate = new Date();
      membership.calculateEndDate();
      membership.notchpayTransactionId = event.transaction.id;
      await membership.save();

      await User.findByIdAndUpdate(membership.user, {
        membershipStatus: "active",
        currentMembership: reference,
      });

      console.log(`✅ Webhook: Membership activé pour ${reference}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Erreur webhook Notch Pay:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @route   POST /api/membership/webhook
// @desc    Webhook Stripe pour confirmation de paiement (optionnel)
// @access  Public (mais vérifié par Stripe)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.stripeWebhookSecret,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const membershipId = session.metadata.membershipId;

      const membership = await Membership.findById(membershipId);
      if (membership) {
        membership.paymentStatus = "paid";
        membership.startDate = new Date();
        membership.calculateEndDate();
        membership.stripePaymentIntentId = session.payment_intent;
        await membership.save();

        await User.findByIdAndUpdate(membership.user, {
          membershipStatus: "active",
          currentMembership: membershipId,
        });
      }
    }

    res.json({ received: true });
  },
);

// @route   GET /api/membership/success (DEPRECATED - utiliser verify-session)
// @desc    Page de confirmation après paiement
// @access  Public
router.get("/success", async (req, res) => {
  res.json({ message: "Utilisez POST /verify-session à la place" });
});

export default router;
