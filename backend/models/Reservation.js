import mongoose from "mongoose";
const reservationSchema = new mongoose.Schema(
  { 
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // firstname: { type: String, required: true },
    // lastname: { type: String, required: true },
    // email: { type: String, required: true },
    // phone: { type: String, required: true },
    // gender: { type: String, required: true },
    // profession: { type: String, required: true },
    activity:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        required: true
    }
  },
  { timestamps: true }
);
const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
