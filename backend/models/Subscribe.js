import mongoose from "mongoose";

const subscribeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    // Jeton de désinscription, utilisable sans compte : le lien part dans
    // chaque message. Attribué à l'inscription, et rempli à la volée pour les
    // abonnés enregistrés avant cette fonctionnalité.
    unsubscribeToken: {
      type: String,
      default: null,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
const Subscribe = mongoose.model("Subscribe", subscribeSchema);
export default Subscribe;
