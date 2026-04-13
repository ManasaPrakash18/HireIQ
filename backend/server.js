// 1. Imports
const express = require('express');
const cors = require('cors');
const axios = require('axios');

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

app.post('/analyze', async (req, res) => {
    let { resume, jd } = req.body;
    let response = await axios.post('http://localhost:8000/analyze', { resume: resume, job_description: jd });
    console.log(resume);
    console.log(jd);
    res.json(response.data);
    console.lo

})

// 5. Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
