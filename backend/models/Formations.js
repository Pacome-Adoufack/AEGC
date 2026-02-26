// models/Formation.js
import mongoose from "mongoose";

const FormationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  teacher: { type: String, required: true },
  duration: { type: String, required: true }, 
  level: { type: String, required: true }, 
  price: { type: Number, required: true },
  location:{type: String, required:true}
}, { timestamps: true });

export default mongoose.model("Formation", FormationSchema);
