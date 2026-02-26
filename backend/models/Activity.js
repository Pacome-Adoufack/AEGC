import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: String, default: Date.now },
    timeParis: { type: String, required: true, trim: true },
    timeYaounde: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    moderators: [
      {
        name: { type: String, trim: true },
        subtitle: { type: String, trim: true },
      },
    ],
  
    // Nouveau : tableau d'intervenants
    participants: [
      {
        name: { type: String, trim: true },
        subtitle: { type: String, trim: true },
      },
    ],
  }, {
    timestamps: true,
  });
  
  const Activity = mongoose.model("Activity", activitySchema);
  export default Activity;
  