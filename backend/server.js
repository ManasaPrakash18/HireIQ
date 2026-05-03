// 1. Imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const Analysis = require('./models/analysis');

// 2. Multer Config (memory + validation)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDFs allowed'), false);
        }
        cb(null, true);
    }
});

// 3. Initialize App
const app = express();
const PORT = process.env.PORT || 5001;

// 4. Middleware
app.use(cors());
app.use(express.json());

// 5. MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// 6. Test Route
app.get('/', (req, res) => {
    res.json({ message: "HireIQ Node Server is running 🚀" });
});

// 7. Analyze Route
app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Analyze request received`);

        const { jd } = req.body;

        // Validation
        if (!req.file) {
            return res.status(400).json({ error: 'Resume file is required' });
        }

        if (!jd) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Parse PDF
        const pdfData = await pdfParse(req.file.buffer);
        const resume = pdfData.text;

        // Call Python API
        const response = await axios.post(
            process.env.PYTHON_API,
            { resume, job_description: jd },
            { timeout: 5000 }
        );

        // Save to DB
        const newAnalysis = new Analysis({
            resumeText: resume,
            jdText: jd,
            fitScore: response.data.fit_score,
            matchedSkills: response.data.matchedSkills,
            missingSkills: response.data.missingSkills,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });

        await newAnalysis.save();
        console.log("✅ Analysis saved to DB");

        // Send response
        res.json({
            ...response.data,
            id: newAnalysis._id
        });

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'ML service timeout' });
        }

        console.error("❌ Analysis Failed:", error.message);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

// 8. History Route
app.get('/history', async (req, res) => {
    try {
        const history = await Analysis.find().sort({ created_at: -1 });
        res.json(history);
    } catch (err) {
        console.error("❌ Fetch history failed:", err.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// 9. Multer Error Handler
app.use((err, req, res, next) => {
    if (err.message === 'Only PDFs allowed') {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// 10. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});