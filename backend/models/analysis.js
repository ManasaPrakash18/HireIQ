const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    resumeText: String,
    jdText: String,
    fitScore: Number,
    semanticScore: Number,
    skillScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
    suggestions: [String],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    fileName: String,
    fileSize: Number,
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
