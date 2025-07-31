import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  img: {
    data: Buffer,
    contentType: String,
  },
  year: {
    type: Number,
    required: false, // ou true si tu veux forcer
  },
}, { timestamps: true });

const Image = mongoose.model("Image", imageSchema);

export default Image;
