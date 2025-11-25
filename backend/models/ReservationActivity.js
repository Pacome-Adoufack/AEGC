import mongoose from "mongoose";

const ReservationActivitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    }, { timestamps: true });

const ReservationActivity = mongoose.model("ReservationActivity", ReservationActivitySchema);
export default ReservationActivity;