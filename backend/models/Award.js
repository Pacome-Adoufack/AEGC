import mongoose from "mongoose";

// Fichier joint stocké sur disque. storedPath est relatif au dossier uploads et
// n'est jamais exposé au public (voir serializeAward dans les routes).
const awardFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, trim: true, default: "" },
    storedPath: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number },
  },
  { _id: false },
);

// Une remise de prix : la catégorie (meilleur chercheur, jeune talent…) reste
// stable d'une année sur l'autre, le lauréat change. Un document = un lauréat,
// pour une catégorie et une année. Le nom de la catégorie est libre : le bureau
// peut en ajouter ou en renommer sans toucher au code.
const awardSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    // Ordonne les catégories sur la page sans dépendre de l'ordre de saisie.
    categoryRank: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2200,
    },
    laureate: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    affiliation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
    // Motivation du jury, affichée sous le nom du lauréat.
    citation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    document: { type: awardFileSchema, default: null },
    photo: { type: awardFileSchema, default: null },
    // Décoché par défaut : les lauréats se saisissent à l'avance et ne sont
    // révélés qu'au moment voulu. Même principe que la diffusion des WP.
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

awardSchema.index({ year: -1, categoryRank: 1 });
// Un seul lauréat par catégorie et par année : bloque le doublon créé par un
// double envoi du formulaire.
awardSchema.index({ category: 1, year: 1 }, { unique: true });

const Award = mongoose.model("Award", awardSchema);
export default Award;
