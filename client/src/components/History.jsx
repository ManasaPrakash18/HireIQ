import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const getFitClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "moderate";
    return "low";
};

const formatFitLabel = (score) => {
    if (score >= 80) return "Excellent Fit";
    if (score >= 60) return "Good Fit";
    if (score >= 40) return "Moderate Fit";
    return "Low Fit";
};

export default function History() {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/history`, {
                params: {
                    search: searchTerm,
                    sort: sortBy,
                },
            });

            const records = response.data.history || response.data || [];
            setHistory(records);
            setError("");
        } catch (fetchError) {
            setError(fetchError.response?.data?.error || "Unable to load analysis history.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, sortBy]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleDeleteOne = async (id) => {
        if (!id) return;

        const confirmed = window.confirm("Delete this analysis from history?");
        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/history/${id}`);
            setHistory((current) => current.filter((record) => record._id !== id));
        } catch (deleteError) {
            setError(deleteError.response?.data?.error || "Unable to delete this record.");
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = window.confirm("Delete all records from history?");
        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/history`);
            setHistory([]);
        } catch (deleteError) {
            setError(deleteError.response?.data?.error || "Unable to delete all history records.");
        }
    };

    return (
        <div className="history-panel panel">
            <div className="history-header">
                <div>
                    <h2 id="historyTitle">History</h2>
                    <p id="recordCount">{history.length} total record{history.length === 1 ? "" : "s"}</p>
                </div>

                <div className="history-controls">
                    <input
                        className="history-search"
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search history"
                    />

                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="history-select">
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="highest">Highest fit score</option>
                        <option value="lowest">Lowest fit score</option>
                    </select>

                    <button type="button" className="danger-btn" onClick={handleDeleteAll} disabled={!history.length}>
                        Delete All
                    </button>
                </div>
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
                <p className="loading-state">Loading history...</p>
            ) : !history.length ? (
                <div className="empty-history">
                    <p>No analysis history yet.</p>
                </div>
            ) : (
                <div id="history">
                    {history.map((record) => {
                        const fitScore = Math.round(((record.fit_score ?? record.fitScore ?? 0) * 100));
                        const semanticScore = Math.round(((record.semantic_score ?? record.semanticScore ?? 0) * 100));
                        const skillScore = Math.round(((record.skill_score ?? record.skillScore ?? 0) * 100));

                        return (
                            <div className="history-card panel" key={record._id}>
                                <div className="history-card-top">
                                    <div>
                                        <h3>{record.fileName || "Resume Analysis"}</h3>
                                        <em>{new Date(record.createdAt).toLocaleString()}</em>
                                    </div>

                                    <button type="button" className="small-btn" onClick={() => handleDeleteOne(record._id)}>
                                        Delete
                                    </button>
                                </div>

                                <div className="score-section compact">
                                    <div className={`fit-score ${getFitClass(fitScore)}`}>{fitScore}%</div>
                                    <div className="fit-label">{formatFitLabel(fitScore)}</div>
                                </div>

                                <div className="history-metrics">
                                    <div>
                                        <span>Semantic</span>
                                        <strong>{semanticScore}%</strong>
                                    </div>
                                    <div>
                                        <span>Skill Match</span>
                                        <strong>{skillScore}%</strong>
                                    </div>
                                </div>

                                <div className="result-section">
                                    <h3>Matched Skills</h3>
                                    <div className="skills-container">
                                        {(record.matchedSkills || []).length ? (
                                            (record.matchedSkills || []).map((skill) => (
                                                <span key={skill} className="skill-chip matched">{skill}</span>
                                            ))
                                        ) : (
                                            <p className="empty-state">No skills matched</p>
                                        )}
                                    </div>
                                </div>

                                <div className="result-section">
                                    <h3>Missing Skills</h3>
                                    <div className="skills-container">
                                        {(record.missingSkills || []).length ? (
                                            (record.missingSkills || []).map((skill) => (
                                                <span key={skill} className="skill-chip missing">{skill}</span>
                                            ))
                                        ) : (
                                            <p className="empty-state">No missing skills</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}