import express from "express";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Obtenir tous les memberships (ADMIN/DEV)
router.get("/memberships", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const memberships = await Membership.find()
      .populate("user", "firstName name email membershipStatus")
      .populate("approvedBy", "firstName name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: memberships.length, data: memberships });
  } catch (error) {
    console.error("Erreur récupération memberships:", error);
    res.status(500).json({ error: error.message });
  }
});

// Statistiques des memberships (ADMIN/DEV)
router.get("/memberships/stats", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const now = new Date();

    const totalApproved = await Membership.countDocuments({ submissionStatus: "approved" });
    const activeMemberships = await Membership.find({ submissionStatus: "approved", endDate: { $gt: now } });
    const expiredCount = await Membership.countDocuments({ submissionStatus: "approved", endDate: { $lte: now } });
    const pendingCount = await Membership.countDocuments({ submissionStatus: "pending" });

    const approvedMemberships = await Membership.find({ submissionStatus: "approved" });
    let revenueEUR = 0;
    let revenueUSD = 0;
    approvedMemberships.forEach((m) => {
      if (m.currency === "EUR") revenueEUR += m.amount || 0;
      else if (m.currency === "USD") revenueUSD += m.amount || 0;
    });
    const revenueXAF = approvedMemberships
      .filter((m) => m.currency === "XAF")
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    const [bankCount, orangeMoneyCount, mtnMomoCount, manualFormCount, emailCount, onlineCount] =
      await Promise.all([
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "bank_transfer" }),
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "orange_money" }),
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "mtn_momo" }),
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "manual_form" }),
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "email" }),
        Membership.countDocuments({ submissionStatus: "approved", submissionMethod: "online" }),
      ]);

    res.json({
      success: true,
      stats: {
        total: totalApproved,
        active: activeMemberships.length,
        expired: expiredCount,
        pending: pendingCount,
        revenue: { EUR: revenueEUR, USD: revenueUSD, XAF: revenueXAF },
        paymentMethods: {
          bank_transfer: bankCount,
          orange_money: orangeMoneyCount,
          mtn_momo: mtnMomoCount,
          manual_form: manualFormCount,
          email: emailCount,
          online: onlineCount,
        },
      },
    });
  } catch (error) {
    console.error("Erreur stats memberships:", error);
    res.status(500).json({ error: error.message });
  }
});

// Memberships en attente (ADMIN/DEV)
router.get("/memberships/pending", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const pending = await Membership.find({ submissionStatus: "pending" })
      .populate("user", "firstName name email membershipStatus")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: pending.length, data: pending });
  } catch (error) {
    console.error("Erreur récupération pending memberships:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approuver une demande (ADMIN/DEV)
router.post("/memberships/:id/approve", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: "Membership not found" });

    if (membership.submissionStatus === "approved") {
      return res.json({ success: true, message: "Déjà approuvé", membership });
    }

    const { years, amount, currency } = req.body || {};
    if (amount !== undefined && !isNaN(Number(amount))) membership.amount = Number(amount);
    if (currency && ["EUR", "USD", "XAF"].includes(currency)) membership.currency = currency;

    membership.submissionStatus = "approved";
    membership.startDate = new Date();
    membership.calculateEndDate(Number.isInteger(Number(years)) ? Number(years) : 1);
    membership.approvedBy = req.user.id;
    membership.approvedAt = new Date();
    await membership.save();

    await User.findByIdAndUpdate(membership.user, {
      membershipStatus: "active",
      currentMembership: membership._id,
    });

    const populatedMembership = await Membership.findById(membership._id)
      .populate("user", "firstName name email membershipStatus")
      .populate("approvedBy", "firstName name");

    res.json({ success: true, message: "Membership approuvé", membership: populatedMembership });
  } catch (error) {
    console.error("Erreur approbation membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rejeter une demande (ADMIN/DEV)
router.post("/memberships/:id/reject", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Reason required" });

    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: "Membership not found" });

    membership.submissionStatus = "rejected";
    membership.rejectionReason = reason;
    await membership.save();

    await User.findByIdAndUpdate(membership.user, {
      currentMembership: membership._id,
      membershipStatus: "none",
    });

    const populatedMembership = await Membership.findById(membership._id)
      .populate("user", "firstName name email membershipStatus")
      .populate("approvedBy", "firstName name");

    res.json({ success: true, message: "Membership rejeté", membership: populatedMembership });
  } catch (error) {
    console.error("Erreur rejet membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Activer manuellement un membership (ADMIN/DEV)
router.post("/memberships/activate", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  console.log("🔥 Route /memberships/activate appelée!", req.body);
  try {
    const { email, currency, notes } = req.body;
    if (!email) return res.status(400).json({ error: "email requis" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé avec cet email" });

    const existingMembership = await Membership.findOne({
      user: user._id,
      submissionStatus: "approved",
      endDate: { $gt: new Date() },
    });
    if (existingMembership) {
      return res.status(400).json({
        error: "Cet utilisateur a déjà une cotisation active",
        membership: existingMembership,
      });
    }

    const chosenCurrency = currency && ["EUR", "USD", "XAF"].includes(currency) ? currency : "XAF";
    let amount = 10000;
    if (chosenCurrency === "EUR") amount = 16;
    if (chosenCurrency === "USD") amount = 18;

    const paymentNumber = await Membership.generatePaymentNumber();

    const membership = new Membership({
      user: user._id,
      amount,
      currency: chosenCurrency,
      submissionStatus: "approved",
      submissionMethod: "manual_form",
      paymentNumber,
      startDate: new Date(),
      approvedBy: req.user.id,
      approvedAt: new Date(),
      notes: notes || "Activation manuelle par admin",
    });

    if (req.body.years && Number.isInteger(Number(req.body.years))) {
      membership.calculateEndDate(Number(req.body.years));
    } else {
      membership.calculateEndDate(1);
    }
    if (req.body.amount && !isNaN(Number(req.body.amount))) {
      membership.amount = Number(req.body.amount);
    }

    await membership.save();

    user.membershipStatus = "active";
    user.currentMembership = membership._id;
    await user.save();

    const populatedMembership = await Membership.findById(membership._id)
      .populate("user", "firstName name email membershipStatus")
      .populate("approvedBy", "firstName name");

    res.json({ success: true, message: "Membership activé avec succès", membership: populatedMembership });
  } catch (error) {
    console.error("Erreur activation membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier un membership (ADMIN/DEV)
router.put("/memberships/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const { submissionStatus, notes, endDate } = req.body;

    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ error: "Membership non trouvé" });

    if (submissionStatus) membership.submissionStatus = submissionStatus;
    if (req.body.amount !== undefined && !isNaN(Number(req.body.amount))) membership.amount = Number(req.body.amount);
    if (req.body.currency && ["EUR", "USD", "XAF"].includes(req.body.currency)) membership.currency = req.body.currency;
    if (req.body.years && Number.isInteger(Number(req.body.years))) {
      membership.calculateEndDate(Number(req.body.years));
    } else if (endDate) {
      membership.endDate = new Date(endDate);
    }
    if (notes !== undefined) membership.notes = notes;

    await membership.save();

    if (membership.submissionStatus === "approved" && membership.isActive()) {
      await User.findByIdAndUpdate(membership.user, {
        membershipStatus: "active",
        currentMembership: membership._id,
      });
    } else if (!membership.isActive()) {
      await User.findByIdAndUpdate(membership.user, {
        membershipStatus: "none",
        currentMembership: null,
      });
    }

    const populatedMembership = await Membership.findById(membership._id)
      .populate("user", "firstName name email membershipStatus")
      .populate("approvedBy", "firstName name");

    res.json({ success: true, message: "Membership mis à jour", membership: populatedMembership });
  } catch (error) {
    console.error("Erreur modification membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un membership (ADMIN/DEV)
router.delete("/memberships/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) return res.status(404).json({ error: "Membership non trouvé" });

    await User.findByIdAndUpdate(membership.user, {
      membershipStatus: "none",
      currentMembership: null,
    });

    res.json({ success: true, message: "Membership supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression membership:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
