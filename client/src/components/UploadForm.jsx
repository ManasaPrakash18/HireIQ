import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
    let [formData, setFormData] = useState({
        resume: null,
        jd: ""
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    let handleInput = (event) => {
        let value = event.target.type === "file" ? event.target.files[0] : event.target.value;
        setFormData((currData) => {
            return { ...currData, [event.target.name]: value }
        })
    }

    let handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setResult(null);
        setLoading(true);
        let data = new FormData();
        data.append("resume", formData.resume);
        data.append("jd", formData.jd);
        console.log(formData);
        try {
            const response = await axios.post(
                "http://localhost:5001/analyze",
                data
            );

            setResult(response.data);
        } catch (error) {
            console.error(error);
            setError("Failed to analyze resume!!!");
        } finally {
            setLoading(false);
        }
        // setFormData({
        //     resume: null,
        //     jd: ""
        // })
    }

    let score = result ? result.fit_score * 100 : 0;

    let fitClass =
        score >= 80
            ? "excellent"
            : score >= 60
                ? "good"
                : score >= 40
                    ? "moderate"
                    : "low";

    return (
        <div id="uploadForm" className="form-card">
            <h2>Resume Analysis</h2>

            <p className="form-subtitle">
                Upload your resume and paste a job description to see your match score.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="inputFields">
                    <label htmlFor="resume">
                        Upload Resume (PDF)
                    </label>
                    <input type="file" name="resume" id="resume" onChange={handleInput} required />
                </div>

                <label htmlFor="jd">
                    Job Description
                </label>
                <textarea name="jd" id="jd" value={formData.jd} onChange={handleInput} required></textarea>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn"
                >
                    {loading ? "Analysing..." : "Check Similarity"}
                </button>
            </form>

            {error && (
                <p className="error">
                    {error}
                </p>
            )}

            {result && (
                <div className="result-card">
                    <h2>Resume Analysis</h2>

                    <div className="score-section">
                        <div className={`fit-score ${fitClass}`}>
                            {(result.fit_score * 100).toFixed(0)}%
                        </div>

                    </div>

                    <p className="analysis-summary">
                        {result.matchedSkills.length} matched skills • {" "}
                        {result.missingSkills.length} missing skills
                    </p>

                    <div>
                        <h3>Matched Skills</h3>

                        <div className="skills-container">
                            {result.matchedSkills.length ? (
                                result.matchedSkills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="skill-chip matched"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p>No matching skills found.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3>Missing Skills</h3>

                        <div className="skills-container">
                            {result.missingSkills.length ? (
                                result.missingSkills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="skill-chip missing"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p>No missing skills found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}