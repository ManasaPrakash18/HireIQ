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
                    <p>Total records : {history.length}</p>

                    {history.map((record) => (
                        <div key={record._id}>
                            <hr />
                            <h3>{record.fileName}</h3>  
                            <em>Created At : {new Date(record.createdAt).toLocaleDateString()}</em>
                            <br />
                            <p>Fit Score : {(record.fitScore *100).toFixed(2)}%</p>
                            <p>Matched Skills : {record.matchedSkills.join(', ')}</p>
                            <p>Missing Skills : {record.missingSkills.join(', ')}</p>
                        </div>
                    ))}
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