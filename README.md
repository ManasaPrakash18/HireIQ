# HireIQ

HireIQ is an AI-powered resume-to-job-description matching platform. Users upload a PDF resume, paste a job description, and receive a detailed match report with semantic similarity, explicit skill coverage, matched and missing skills, improvement suggestions, and full history tracking.

## Features

- PDF resume upload
- Job description analysis
- Semantic similarity using SBERT embeddings
- Technical skill extraction and normalization
- Hybrid fit scoring
- Matched and missing skills
- Improvement suggestions
- Analysis history with search, sorting, and deletion
- PDF export for reports
- Responsive notebook-style interface

## Architecture

- Frontend: React + Vite
- Backend: Node.js + Express
- ML service: Python + FastAPI + SentenceTransformers
- Persistence: MongoDB

## Tech Stack

- React 19
- Vite
- Axios
- Express.js
- MongoDB + Mongoose
- FastAPI
- Python 3.14
- SentenceTransformers
- scikit-learn
- pandas
- regex

## How it Works

1. The frontend collects a PDF resume and a job description.
2. The Express backend parses the PDF text and forwards the data to the FastAPI ML service.
3. The ML service encodes both texts with SentenceTransformer("all-MiniLM-L6-v2").
4. Cosine similarity is calculated to produce a semantic score.
5. A technical skill dictionary is matched against the resume and job description.
6. The service computes matched and missing skills.
7. A hybrid score is calculated as:

   fit_score = (0.7 * semantic_score) + (0.3 * skill_score)

8. The backend stores the result in MongoDB and returns it to the client.
9. The user can review, search, sort, delete, and export history records.

## ML Approach

The ML service uses the sentence-transformers all-MiniLM-L6-v2 model to compare the semantic meaning of the resume and job description. This captures intent and context beyond exact keyword overlap.

## Hybrid Scoring Explained

The final fit score blends semantic similarity and technical match coverage:

- Semantic score: relationship and contextual alignment between resume and job description
- Skill score: proportion of required skills present in the resume
- Hybrid score: weighted average to balance meaning and explicit skill alignment

## Skills Extraction Explained

The skills database uses canonical technology names plus carefully normalized aliases. Examples include:

- React / ReactJS / react.js
- Node.js / NodeJS / node.js
- PostgreSQL / Postgres / postgres
- AWS / Amazon Web Services / amazon web services

The extractor avoids broad false positives by requiring token boundaries and normalized matching.

## Project Structure

```text
HireIQ/
├── app/
│   ├── main.py
│   └── skills.json
├── backend/
│   ├── models/
│   │   └── analysis.js
│   ├── server.js
│   └── package.json
├── client/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
└── hireiq/
```

## Installation

### 1. Python environment

```bash
python -m venv hireiq
source hireiq/bin/activate
pip install -r requirements.txt
```

### 2. Node backend

```bash
cd backend
npm install
```

### 3. Frontend

```bash
cd client
npm install
```

## Environment Variables

Copy the example file and set your local values:

```bash
cp .env.example .env
```

Required variables:

- PORT=5001
- FASTAPI_URL=http://localhost:8000/analyze
- MONGODB_URI=mongodb://127.0.0.1:27017/hireiq
- VITE_API_URL=http://localhost:5001

## Run the app

### Frontend

```bash
cd client
npm run dev
```

### Backend

```bash
cd backend
node server.js
```

### FastAPI ML service

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## MongoDB setup

Start MongoDB locally or point the MONGODB_URI to an existing server.

Example:

```bash
mongod --dbpath /tmp/hireiq-data
```

## API Endpoints

### Backend

- GET /
- GET /health
- POST /analyze
- GET /history
- DELETE /history/:id
- DELETE /history

### ML service

- GET /
- GET /health
- POST /analyze

## Example Request

```json
{
  "resume": "Built web apps with React and Node.js. Worked with MongoDB and Docker.",
  "job_description": "Looking for a full stack developer with React, Node.js, Express, MongoDB, Docker and AWS."
}
```

## Example Response

```json
{
  "fit_score": 0.82,
  "semantic_score": 0.9,
  "skill_score": 0.67,
  "matchedSkills": ["React", "Node.js", "MongoDB"],
  "missingSkills": ["Docker", "AWS"],
  "suggestions": [
    "Add experience with Docker to strengthen alignment with the role.",
    "Add experience with AWS to strengthen alignment with the role."
  ]
}
```

## Screenshots

Add screenshots here once the app is running in a local environment.

## Future Improvements

- Resume text extraction for DOCX and TXT
- More robust skill ontology and synonyms
- User authentication and saved profiles
- Comparison of multiple jobs or resumes
- Better visualization and dashboard analytics
