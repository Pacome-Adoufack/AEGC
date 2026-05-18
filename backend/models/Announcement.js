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
  },
  {
    timestamps: true,
  },
);

announcementSchema.index({ isPublished: 1, isPinned: -1, publishedAt: -1 });
announcementSchema.index({ expiresAt: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
