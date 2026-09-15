import json
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class AnalysisRequest(BaseModel):
    resume: str
    job_description: str


app = FastAPI(title="HireIQ ML Service")

MODEL_NAME = "all-MiniLM-L6-v2"
BASE_DIR = Path(__file__).resolve().parent
SKILLS_PATH = BASE_DIR / "skills.json"

print("Loading all-MiniLM-L6-v2 model...")
model = SentenceTransformer(MODEL_NAME)
print("Successfully loaded the model")


with SKILLS_PATH.open("r", encoding="utf-8") as file:
    raw_skills = json.load(file)


def normalize_skill_text(value: str) -> str:
    if value is None:
        return ""
    normalized = value.lower().strip()
    normalized = normalized.replace("&", " and ")
    normalized = normalized.replace("+", " plus ")
    normalized = normalized.replace(".", " ")
    normalized = normalized.replace("-", " ")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return " ".join(normalized.split())


SKILLS_DB: dict[str, str] = {}
for skill_name, metadata in raw_skills.items():
    aliases = [skill_name]
    aliases.extend(metadata.get("aliases", []))
    aliases.extend(metadata.get("related", []))
    aliases.extend(metadata.get("deprecated", []))

    for alias in aliases:
        if not isinstance(alias, str):
            continue
        normalized_alias = normalize_skill_text(alias)
        if not normalized_alias:
            continue
        SKILLS_DB[normalized_alias] = skill_name


def extract_skills(text: str):
    if not isinstance(text, str) or not text.strip():
        return []

    normalized_text = normalize_skill_text(text)
    found = set()

    for alias_key, canonical_name in SKILLS_DB.items():
        pattern = rf"(?<![a-z0-9]){re.escape(alias_key)}(?![a-z0-9])"
        if re.search(pattern, normalized_text):
            found.add(canonical_name)

    return sorted(found)


def generate_suggestions(missing_skills: list[str]) -> list[str]:
    if not missing_skills:
        return ["Your resume aligns well with the key requirements for this role."]

    suggestions = []
    for skill in missing_skills[:5]:
        suggestions.append(f"Add experience with {skill} to strengthen alignment with the role.")
    return suggestions


def perform_analysis(resume: str, job_description: str):
    if not resume or not str(resume).strip() or not job_description or not str(job_description).strip():
        return {
            "fit_score": 0.0,
            "semantic_score": 0.0,
            "skill_score": 0.0,
            "matchedSkills": [],
            "missingSkills": [],
            "suggestions": ["Add both a resume and a job description to generate a match analysis."],
        }

    resume_embedding = model.encode(resume)
    jd_embedding = model.encode(job_description)
    semantic_score = float(cosine_similarity([resume_embedding], [jd_embedding])[0][0])
    semantic_score = max(0.0, min(1.0, semantic_score))

    resume_skills = set(extract_skills(resume))
    jd_skills = extract_skills(job_description)

    matched_skills = [skill for skill in jd_skills if skill in resume_skills]
    missing_skills = [skill for skill in jd_skills if skill not in resume_skills]

    if len(jd_skills) > 0:
        skill_score = len(matched_skills) / len(jd_skills)
    else:
        skill_score = 0.0

    fit_score = (0.7 * semantic_score) + (0.3 * skill_score)
    fit_score = max(0.0, min(1.0, fit_score))

    return {
        "fit_score": round(float(fit_score), 4),
        "semantic_score": round(float(semantic_score), 4),
        "skill_score": round(float(skill_score), 4),
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "suggestions": generate_suggestions(missing_skills),
    }


@app.get("/")
def home():
    return {"message": "HireIQ ML service is live"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze")
def analyze_endpoint(request: AnalysisRequest):
    try:
        result = perform_analysis(request.resume, request.job_description)
        return result
    except Exception as exc:  # pragma: no cover - safety net for runtime failures
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}") from exc