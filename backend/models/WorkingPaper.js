import mongoose from "mongoose";

const workingPaperSchema = new mongoose.Schema(
  {
    title: {
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
