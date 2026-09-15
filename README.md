# HireIQ

HireIQ is an AI-powered resume-to-job-description matching platform. Users upload a PDF resume, paste a job description, and receive a detailed match report with semantic similarity, explicit skill coverage, matched and missing skills, improvement suggestions, and full history tracking.

## Live Application

Use HireIQ here: [https://hire-iq-kappa.vercel.app/](https://hire-iq-kappa.vercel.app/)

The production deployment uses Vercel for the React frontend and Render for the Node.js API and FastAPI ML service. MongoDB Atlas stores analysis history.

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
- Python 3.12
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

The ML service is pinned to Python 3.12 in `runtime.txt`. The production dependency list uses the CPU-only PyTorch wheel because the hosted ML service does not require a GPU.

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

Do not commit real credentials. Production services receive their environment variables through their hosting provider's settings.

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

## Production Deployment

### Service order

Deploy the services in this order:

1. FastAPI ML service on Render
2. Node.js backend on Render
3. React frontend on Vercel

### Render: FastAPI ML service

Create a Render Web Service using the repository root as the root directory.

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Python version: `3.12.11` from `runtime.txt` or the Render `PYTHON_VERSION` environment variable

The service loads `all-MiniLM-L6-v2` during startup and needs enough memory for PyTorch and the model. A service with at least 1 GB RAM is recommended.

### Render: Node.js backend

Create a second Render Web Service connected to the same repository.

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Set these environment variables in Render:

```env
MONGODB_URI=<MongoDB Atlas connection string>
FASTAPI_URL=https://hireiq-5-b0sg.onrender.com/analyze
```

Render supplies `PORT` automatically. The server binds to `0.0.0.0` and uses Render's assigned port.

### Vercel: React frontend

Import the repository into Vercel with these settings:

- Root directory: `client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set this Vercel environment variable with **Config** visibility:

```env
VITE_API_URL=https://<your-backend-service>.onrender.com
```

Because Vite exposes `VITE_` variables to the browser, `VITE_API_URL` must not be marked as a secret.

### MongoDB Atlas

Create a database user and configure Network Access so the Render backend can connect. Use the Atlas connection string as `MONGODB_URI`. Rotate credentials if they have ever been exposed in source files, screenshots, logs, or chat messages.

### Deployment verification

After each service deploys, verify:

```text
GET https://<ml-service>.onrender.com/health
GET https://<backend-service>.onrender.com/health
GET https://hire-iq-kappa.vercel.app/
```

The backend health endpoint should return:

```json
{"status":"ok"}
```

Then upload a text-based PDF resume, submit a job description, and confirm that the result is saved in History.

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
