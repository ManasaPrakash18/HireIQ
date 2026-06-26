const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    resumeText: String,
    jdText: String,
    fitScore: Number,
    matchedSkills: [String], // Array of strings
    missingSkills: [String], // Array of strings
    createdAt: {
        type: Date,
        default: Date.now
    },
    fileName: String,
    fileSize: Number
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
