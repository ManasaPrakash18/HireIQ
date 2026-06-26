from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi import FastAPI
from pydantic import BaseModel

class analysis_request(BaseModel):
    resume:  str
    job_description: str

app = FastAPI()

print("Loading all-MiniLM-L6-v2 Model ...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Successfully loaded the model\n\n\n\n")

vectorizer = TfidfVectorizer(stop_words='english')

def perform_analysis(resume:str, job_description:str):
    resume_embedding = model.encode(resume)
    jd_embedding = model.encode(job_description)

    # Gives Cosine similarity value between 0 to 1
    score = cosine_similarity([resume_embedding], [jd_embedding])

    # vectorizer considers the special words and ignore common words 
    vectorizer.fit([job_description])
    keywords=vectorizer.get_feature_names_out()

    # print(keywords)

    # transforms sparse matrix into 2D matrix
    tfidf_matrix = vectorizer.transform([job_description])

    # print("\n\n\n\n")
    # print(tfidf_matrix)

    # 2D matrix to array as it has only one document words
    tfidf_scores = tfidf_matrix.toarray()[0]

    # print(tfidf_scores)

    # pairs the special words and their scores along
    word_scores = list(zip(keywords, tfidf_scores))
    # print(word_scores)

    # sorting the words based on their scores - decreasing order
    sorted_keywords = sorted(word_scores, key=lambda x: x[1], reverse=True)
    # print(sorted_keywords[:5])

    matched_skills = []
    missing_skills = []

    # checking for the special words are their or not in resume
    for word, score in sorted_keywords[:10]:
        if word in resume.lower():
            matched_skills.append(word)
        else:
            missing_skills.append(word)

    # print(f"Matched Skills : {matched_skills}\n\n")
    # print(f"Missing Skills : {missing_skills}\n\n")

    return {
        "fit_score": float(score),
        "matchedSkills" : matched_skills,
        "missingSkills" : missing_skills
    }


@app.get("/")
def home():
    return {"message" : "HireIq server is live"}

@app.post("/analyze")
def analyze_endpoint(request : analysis_request):
    result = perform_analysis(request.resume, request.job_description)
    return result