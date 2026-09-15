require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const { pathToFileURL } = require('url');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');

const Analysis = require('./models/analysis');

const app = express();
const PORT = process.env.PORT || 5001;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000/analyze';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hireiq';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDFs allowed'), false);
        }
        cb(null, true);
    },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

mongoose
    .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((error) => console.error('❌ MongoDB connection error:', error.message));

const normalizeHistoryRecord = (record) => ({
    _id: record._id,
    fileName: record.fileName || 'Resume.pdf',
    jdText: record.jdText || '',
    fit_score: record.fitScore ?? record.fit_score ?? 0,
    semantic_score: record.semanticScore ?? record.semantic_score ?? 0,
    skill_score: record.skillScore ?? record.skill_score ?? 0,
    matchedSkills: record.matchedSkills || [],
    missingSkills: record.missingSkills || [],
    suggestions: record.suggestions || [],
    createdAt: record.createdAt || new Date(),
});

async function extractTextFromPdf(fileBuffer) {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const uint8Array = new Uint8Array(fileBuffer);
    const pdfDoc = await getDocument({ data: uint8Array }).promise;

    let text = '';
    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        const page = await pdfDoc.getPage(pageNumber);
        const content = await page.getTextContent();
        text += `${content.items.map((item) => item.str).join(' ')}\n`;
    }

    if (typeof pdfDoc.destroy === 'function') {
        await pdfDoc.destroy();
    }
    return text.trim();
}

app.get('/', (req, res) => {
    res.json({ message: 'HireIQ Node Server is running 🚀' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        const { jd } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Resume file is required' });
        }

        if (!jd || !jd.trim()) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        const resume = await extractTextFromPdf(req.file.buffer);

        if (!resume) {
            return res.status(400).json({ error: 'No readable text found in the uploaded PDF' });
        }

        const response = await axios.post(
            FASTAPI_URL,
            { resume, job_description: jd },
            { timeout: 20000 }
        );

        const payload = response.data || {};
        const newAnalysis = new Analysis({
            resumeText: resume,
            jdText: jd,
            fitScore: payload.fit_score ?? 0,
            semanticScore: payload.semantic_score ?? 0,
            skillScore: payload.skill_score ?? 0,
            matchedSkills: payload.matchedSkills || [],
            missingSkills: payload.missingSkills || [],
            suggestions: payload.suggestions || [],
            fileName: req.file.originalname,
            fileSize: req.file.size,
        });

        const saved = await newAnalysis.save();

        return res.status(200).json({
            ...payload,
            id: saved._id,
            createdAt: saved.createdAt,
        });
    } catch (error) {
        if (error.name === 'MulterError') {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'ML service timed out while analyzing the resume.' });
        }

        if (error.response?.status === 422) {
            return res.status(400).json({ error: 'Invalid request payload sent to the ML service.' });
        }

        console.error('❌ Analysis failed:', error.message);
        return res.status(500).json({ error: 'Failed to analyze resume.' });
    }
});

app.get('/history', async (req, res) => {
    try {
        const { search = '', sort = 'newest' } = req.query;
        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            highest: { fitScore: -1, createdAt: -1 },
            lowest: { fitScore: 1, createdAt: -1 },
        };

        const query = {};
        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim(), 'i');
            query.$or = [{ fileName: regex }, { jdText: regex }, { matchedSkills: regex }, { missingSkills: regex }];
        }

        const history = await Analysis.find(query).sort(sortMap[sort] || sortMap.newest).lean();
        return res.json({
            count: history.length,
            history: history.map(normalizeHistoryRecord),
        });
    } catch (error) {
        console.error('❌ Fetch history failed:', error.message);
        return res.status(500).json({ error: 'Failed to fetch analysis history.' });
    }
});

app.delete('/history/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid history record ID.' });
        }

        const deleted = await Analysis.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'History record not found.' });
        }

        return res.json({ success: true, deletedId: id });
    } catch (error) {
        console.error('❌ Delete history record failed:', error.message);
        return res.status(500).json({ error: 'Failed to delete the selected history record.' });
    }
});

app.delete('/history', async (req, res) => {
    try {
        const result = await Analysis.deleteMany({});
        return res.json({ success: true, deletedCount: result.deletedCount || 0 });
    } catch (error) {
        console.error('❌ Delete all history failed:', error.message);
        return res.status(500).json({ error: 'Failed to delete all history records.' });
    }
});

app.use((err, req, res, next) => {
    if (err.message === 'Only PDFs allowed') {
        return res.status(400).json({ error: err.message });
    }

    console.error('Unhandled server error:', err.message);
    return res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});