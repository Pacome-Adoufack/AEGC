import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    presenter: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true
});
const Activity = mongoose.model('Activity', activitySchema);
export default Activity;