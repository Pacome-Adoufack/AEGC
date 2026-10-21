import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },
    category: {
      type: String,
      enum: ["ANNOUNCEMENT", "INFO", "EVENT"],
      default: "ANNOUNCEMENT",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Pièces jointes (PDF, images). storedPath est relatif au dossier uploads.
    // Envoi aux abonnés. Conservé sur l'annonce pour qu'on voie, dans
    // l'administration, ce qui a déjà été envoyé — et qu'on n'envoie pas deux
    // fois la même actualité.
    newsletter: {
      sentAt: { type: Date, default: null },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      recipients: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    attachments: [
      {
        originalName: { type: String, required: true, trim: true },
        storedPath: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number },
        kind: { type: String, enum: ["image", "pdf"], required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

announcementSchema.index({ isPublished: 1, isPinned: -1, publishedAt: -1 });
announcementSchema.index({ expiresAt: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
