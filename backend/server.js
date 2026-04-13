// 1. Imports
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 2. Initialize App
const app = express();
const PORT = 5001;

// 3. Middleware (So the server can understand JSON and allow cross-origin requests)
app.use(cors());
app.use(express.json());

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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }

})

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
