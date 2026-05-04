import mongoose from "mongoose";

const committeeMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    roleTitle: {
      type: String,
      trim: true,
      default: "",
    },
    affiliation: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    profileLink: {
      type: String,
      trim: true,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

committeeMemberSchema.index({ isActive: 1, displayOrder: 1, fullName: 1 });

const CommitteeMember = mongoose.model(
  "CommitteeMember",
  committeeMemberSchema,
);

export default CommitteeMember;
