import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const loadingSteps = [
    "Uploading Resume",
    "Analyzing Resume",
    "Comparing Job Requirements",
    "Calculating Match",
    "Preparing Results",
];

const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent Fit";
    if (score >= 60) return "Good Fit";
    if (score >= 40) return "Moderate Fit";
    return "Low Fit";
};

const getScoreClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "moderate";
    return "low";
};

export default function UploadForm() {
    const [formData, setFormData] = useState({
        resume: null,
        jd: "",
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState("");

    const handleInput = (event) => {
        const value = event.target.type === "file" ? event.target.files[0] : event.target.value;
        setFormData((current) => ({ ...current, [event.target.name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.resume || !formData.jd.trim()) {
            setError("Please upload a PDF resume and provide a job description.");
            return;
        }

        setError("");
        setResult(null);
        setLoading(true);
        setLoadingStep(0);

        loadingSteps.forEach((_, index) => {
            window.setTimeout(() => setLoadingStep(index), index * 400);
        });

        const data = new FormData();
        data.append("resume", formData.resume);
        data.append("jd", formData.jd);

        try {
            const response = await axios.post(`${API_URL}/analyze`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setResult(response.data);
        } catch (submitError) {
            const message = submitError.response?.data?.error || "Failed to analyze the resume.";
            setError(message);
        } finally {
            window.setTimeout(() => setLoading(false), 800);
        }
    };

    const exportPdf = () => {
        if (!result) return;

        const doc = new jsPDF();
        const fitPct = Math.round((result.fit_score ?? 0) * 100);
        const semanticPct = Math.round((result.semantic_score ?? 0) * 100);
        const skillPct = Math.round((result.skill_score ?? 0) * 100);

        doc.setFontSize(20);
        doc.text("HireIQ", 14, 20);
        doc.setFontSize(12);
        doc.text("Resume Analysis Report", 14, 30);
        doc.text(`Fit Score: ${fitPct}%`, 14, 46);
        doc.text(`Semantic Similarity: ${semanticPct}%`, 14, 54);
        doc.text(`Skill Match: ${skillPct}%`, 14, 62);

        let y = 78;
        const addList = (title, items) => {
            doc.setFontSize(12);
            doc.text(title, 14, y);
            y += 8;

            if (!items.length) {
                doc.text("None", 18, y);
                y += 10;
                return;
            }

            items.forEach((item) => {
                const lines = doc.splitTextToSize(`• ${item}`, 176);
                doc.text(lines, 18, y);
                y += lines.length * 6 + 2;
                if (y > 270) {
                    doc.addPage();
                    y = 18;
                }
            });
        };

        addList("Matched Skills", result.matchedSkills || []);
        addList("Missing Skills", result.missingSkills || []);
        addList("Improvement Suggestions", result.suggestions || []);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 290);
        doc.save("hireiq-report.pdf");
    };

    const fitScore = Math.round((result?.fit_score ?? 0) * 100);
    const semanticScore = Math.round((result?.semantic_score ?? 0) * 100);
    const skillScore = Math.round((result?.skill_score ?? 0) * 100);

    return (
        <div id="uploadForm" className="panel form-card">
            <h2>Resume Analysis</h2>

            <p className="form-subtitle">
                Upload your resume and paste a job description to assess your fit.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="inputFields">
                    <label htmlFor="resume">Upload Resume (PDF)</label>
                    <input type="file" name="resume" id="resume" accept="application/pdf" onChange={handleInput} required />
                </div>

                <div className="inputFields job-field">
                    <label htmlFor="jd">Job Description</label>
                    <textarea name="jd" id="jd" value={formData.jd} onChange={handleInput} required placeholder="Paste the job description here..." />
                </div>

                <button type="submit" disabled={loading} className="primary-btn">
                    {loading ? loadingSteps[loadingStep] || "Preparing Results" : "Check Fit"}
                </button>
            </form>

            {error && <p className="error">{error}</p>}

            {loading && (
                <div className="status-box">
                    <p className="loading-label">Processing resume</p>
                    <p className="loading-state">{loadingSteps[loadingStep] || loadingSteps[0]}</p>
                </div>
            )}

            {result && (
                <div className="result-card panel">
                    <div className="result-header">
                        <h2>Analysis Results</h2>
                        <button type="button" className="secondary-btn" onClick={exportPdf}>Export PDF</button>
                    </div>

                    <div className="score-section">
                        <div className={`fit-score ${getScoreClass(fitScore)}`}>{fitScore}%</div>
                        <div className="fit-label">{getScoreLabel(fitScore)}</div>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <span className="metric-label">Fit Score</span>
                            <strong>{fitScore}%</strong>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Semantic Similarity</span>
                            <strong>{semanticScore}%</strong>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">Skill Match</span>
                            <strong>{skillScore}%</strong>
                        </div>
                    </div>

                    <p className="analysis-summary">
                        {result.matchedSkills?.length || 0} matched skills • {result.missingSkills?.length || 0} missing skills
                    </p>

                    <div className="result-section">
                        <h3>Matched Skills</h3>
                        <div className="skills-container">
                            {result.matchedSkills?.length ? (
                                result.matchedSkills.map((skill) => (
                                    <span key={skill} className="skill-chip matched">{skill}</span>
                                ))
                            ) : (
                                <p className="empty-state">No matching skills found.</p>
                            )}
                        </div>
                    </div>

                    <div className="result-section">
                        <h3>Missing Skills</h3>
                        <div className="skills-container">
                            {result.missingSkills?.length ? (
                                result.missingSkills.map((skill) => (
                                    <span key={skill} className="skill-chip missing">{skill}</span>
                                ))
                            ) : (
                                <p className="empty-state">No missing skills found.</p>
                            )}
                        </div>
                    </div>

                    <div className="result-section">
                        <h3>Improvement Suggestions</h3>
                        <ul className="suggestion-list">
                            {result.suggestions?.length ? (
                                result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)
                            ) : (
                                <li className="empty-state">No suggestions at this time.</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}