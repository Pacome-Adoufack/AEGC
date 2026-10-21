import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    telefonNummer: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "dev", "dispatcher"],
      default: "user",
    },
    membershipStatus: {
      type: String,
      enum: ["active", "expired", "none"],
      default: "none",
    },
    currentMembership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },
    // Consentement à recevoir les actualités de l'association.
    // `null` = la personne n'a jamais répondu : on ne lui écrit pas, et un
    // bandeau lui pose la question à sa prochaine connexion. C'est ce qui
    // distingue « a refusé » de « n'a jamais été sollicité », distinction
    // exigée par le RGPD pour les comptes créés avant la case à cocher.
    newsletterOptIn: {
      type: Boolean,
      default: null,
    },
    // Date de la réponse : c'est la preuve du consentement.
    newsletterOptInAt: {
      type: Date,
      default: null,
    },
    // Jeton de désinscription, utilisable sans se connecter : le lien figure
    // dans chaque message envoyé.
    newsletterToken: {
      type: String,
      default: null,
      index: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
