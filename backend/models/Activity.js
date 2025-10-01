import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // image: {
    //     type: String,
    //     required: true,
    //     trim: true
    // },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        default: Date.now
    },
    timeParis:{
        type: String,
        required: true,
        trim: true
    },
    timeYaounde:{
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    moderator: {
        type: String,
        required: true,
        trim: true
    },
    subtitleModerator: {
        type: String,
        required: true,
        trim: true
    },
    participantOne: {
        type: String,
        required: true,
        trim: true
    },
    participantTwo: {
        type: String,
        required: true,
        trim: true
    },
    participantThree: {
        type: String,
        required: true,
        trim: true
    },
    subtitleParticipantOne: {
        type: String,
        required: true,
        trim: true
    },
    subtitleParticipantTwo: {
        type: String,
        required: true,
        trim: true
    },
    subtitleParticipantThree: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true
});
const Activity = mongoose.model('Activity', activitySchema);
export default Activity;