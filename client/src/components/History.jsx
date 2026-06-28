import { useState, useEffect } from "react"
import axios from "axios";

export default function History() {
    let [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const response = await axios.get(
                "http://localhost:5001/history"
            );

            setHistory(response.data);
        };

        fetchHistory();
    }, []);
    let records = history.length;

    return (
        <div>
            {records ? (
                <>
                    <h2 id="historyTitle">History</h2>
                    <h3 id="recordCount">Total records : {history.length}</h3>

                    <div id="history">

                        {history.map((record) => (
                            <div className="history-card" key={record._id}>
                                <h3>{record.fileName}</h3>

                                <em>
                                    {new Date(record.createdAt).toLocaleDateString()}
                                </em>

                                <div className="score-section">
                                    <div className="fit-score">
                                        {(record.fitScore * 100).toFixed(0)}%
                                    </div>

                                    <div className="fit-label">
                                        {(record.fitScore * 100) >= 80
                                            ? "Excellent Fit"
                                            : (record.fitScore * 100) >= 60
                                                ? "Good Fit"
                                                : (record.fitScore * 100) >= 40
                                                    ? "Moderate Fit"
                                                    : "Low Fit"}
                                    </div>
                                </div>

                                <div>
                                    <h3>Matched Skills</h3>

                                    <div className="skills-container">
                                        {record.matchedSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="skill-chip matched"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3>Missing Skills</h3>

                                    <div className="skills-container">
                                        {record.missingSkills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="skill-chip missing"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr />
                </>
            ) : (
                <p>No analysis history yet.</p>
            )}
            {/* <pre>
                {JSON.stringify(history, null, 2)}
            </pre> */}
        </div>
    )
}