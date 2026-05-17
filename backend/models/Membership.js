import mongoose from "mongoose";

// Schéma pour la cotisation annuelle (membership/subscription)
const MembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      default: "standard",
    },
    amount: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      enum: ["EUR", "USD", "XAF"],
      default: "XAF",
    },

    submissionStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submissionMethod: {
      type: String,
      enum: ["bank_transfer", "orange_money", "mtn_momo", "manual_form", "email", "online"],
      default: "bank_transfer",
    },
    proofOfPaymentUrl: {
      type: String,
      default: null,
    },
    membershipFormUrl: {
      type: String,
      default: null,
    },
    membershipFormData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rejectionReason: {
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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
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
MembershipSchema.index({ user: 1, submissionStatus: 1 });
MembershipSchema.index({ endDate: 1 });

// Méthode statique pour générer un numéro de paiement unique
MembershipSchema.statics.generatePaymentNumber = async function () {
  const year = new Date().getFullYear();
  const lastMembership = await this.findOne({
    paymentNumber: new RegExp(`^AEGC-${year}-\\d{5}$`),
  })
    .sort({ paymentNumber: -1 })
    .select("paymentNumber")
    .lean();

  const lastSequence = lastMembership?.paymentNumber
    ? Number.parseInt(lastMembership.paymentNumber.slice(-5), 10)
    : 0;

  const nextNumber = String(lastSequence + 1).padStart(5, "0");
  return `AEGC-${year}-${nextNumber}`;
};

// Méthode pour vérifier si le membership est actif
MembershipSchema.methods.isActive = function () {
  if (this.submissionStatus !== "approved") return false;
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
