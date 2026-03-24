import mongoose from "mongoose";

const publicationIssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    stats: {
      acceptedCount: {
        type: Number,
        min: 0,
      },
      rejectedCount: {
        type: Number,
        min: 0,
      },
    },
    // PDF éditorial assemblé localement puis uploadé par l'admin.
    pdfFile: {
      filename: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
      },
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
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
  {
    timestamps: true,
  },
);

const PublicationIssue = mongoose.model(
  "PublicationIssue",
  publicationIssueSchema,
);
export default PublicationIssue;
