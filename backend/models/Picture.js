import mongoose from "mongoose";

const pictureSchema = new mongoose.Schema({
    image: { type: String, required: true },
    }, { timestamps: true });

const Picture = mongoose.model("picture", pictureSchema);

export default Picture;