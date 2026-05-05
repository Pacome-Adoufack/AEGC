import mongoose from "mongoose";

const workingPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    manuscriptLength: {
      type: String,
      trim: true,
      default: "",
    },
    language: {
      type: String,
      enum: ["francais", "anglais"],
      default: "francais",
    },
    submissionRequirements: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["ouvert", "clôturé"],
      default: "ouvert",
    },
    jelCodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contact: {
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
    },
    usefulLinks: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Virtual pour compter les soumissions
workingPaperSchema.virtual("submissionsCount", {
  ref: "Submission",
  localField: "_id",
  foreignField: "workingPaper",
  count: true,
});

// Pour inclure les virtuals dans JSON
workingPaperSchema.set("toJSON", { virtuals: true });
workingPaperSchema.set("toObject", { virtuals: true });

const WorkingPaper = mongoose.model("WorkingPaper", workingPaperSchema);
export default WorkingPaper;
