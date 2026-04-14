// 1. Imports
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
const Analysis = require('./models/analysis');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 2. Initialize App
const app = express();
const PORT = 5001;

// 3. Middleware (So the server can understand JSON and allow cross-origin requests)
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hireiq')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// 4. Test Route
app.get('/', (req, res) => {
    res.json({ message: "HireIQ Node Server is running" });
});

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        const { jd } = req.body;

        const parser = new PDFParse({ data: req.file.buffer });
        const pdfData = await parser.getText();
        await parser.destroy();

        const resume = pdfData.text;
        const response = await axios.post('http://localhost:8000/analyze', {
            resume,
            job_description: jd
        });

        res.json(response.data);
        // Save to MongoDB
        const newAnalysis = new Analysis({
            resumeText: resume, // from pdf extraction
            jdText: jd,
            fitScore: response.data.fit_score, // Check python keys
            matchedSkills: response.data.Matched_skills, // Check python keys
            missingSkills: response.data.Missing_skills // Check python keys
        });

        await newAnalysis.save();
        console.log("Analysis saved to DB");

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }

});

// history route
app.get('/history', async (req, res) => {
    try {
        let history = await Analysis.find().sort({ "created_at": -1 });
        res.json(history);

    } catch (err) {
        res.status(500).send({ err: "Failed to fetch data" });
    }
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
