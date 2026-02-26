import mongoose from "mongoose";

// Schéma pour la cotisation annuelle (membership/subscription)
const MembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["EUR", "USD", "XAF"], // 16 EUR, 18 USD ou 10000 XAF
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "expired", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "manual", "notchpay", "orange_money", "mtn_momo"],
      default: "stripe",
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    notchpayReference: {
      type: String,
      default: null,
    },
    notchpayTransactionId: {
      type: String,
      default: null,
    },
    mobileMoneyPhone: {
      type: String,
      default: null,
    },
    paymentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Utilisé si activation manuelle par admin
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche rapide
MembershipSchema.index({ user: 1, paymentStatus: 1 });
MembershipSchema.index({ paymentNumber: 1 });
MembershipSchema.index({ endDate: 1 });

// Méthode statique pour générer un numéro de paiement unique
MembershipSchema.statics.generatePaymentNumber = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
  });
  const number = String(count + 1).padStart(5, "0");
  return `AEGC-${year}-${number}`;
};

// Méthode pour vérifier si le membership est actif
MembershipSchema.methods.isActive = function () {
  if (this.paymentStatus !== "paid") return false;
  if (!this.endDate) return false;
  return new Date() < this.endDate;
};

// Méthode pour calculer la date de fin (1 an après la date de début)
MembershipSchema.methods.calculateEndDate = function () {
  if (!this.startDate) {
    this.startDate = new Date();
  }
  const endDate = new Date(this.startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  this.endDate = endDate;
  return this.endDate;
};

export default mongoose.model("Membership", MembershipSchema);
