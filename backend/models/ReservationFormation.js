import mongoose from "mongoose";

const ReservationFormationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    formationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formation', required: true },
    message: { type: String }
    }, { timestamps: true });

export default mongoose.model("ReservationFormation", ReservationFormationSchema);