import mongoose from "mongoose";

// Une version de la photo stockée sur disque. storedPath est relatif au dossier uploads.
const photoFileSchema = new mongoose.Schema(
  {
    storedPath: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false },
);

// Photo de la galerie (accueil + page /picture). Le navigateur de l'admin envoie
// deux versions déjà redimensionnées : "full" pour l'affichage en grand, "thumb"
// pour les grilles.
const galleryPhotoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    originalName: {
      type: String,
      trim: true,
      default: "",
    },
    full: { type: photoFileSchema, required: true },
    thumb: { type: photoFileSchema, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

galleryPhotoSchema.index({ createdAt: -1 });

const GalleryPhoto = mongoose.model("GalleryPhoto", galleryPhotoSchema);
export default GalleryPhoto;
