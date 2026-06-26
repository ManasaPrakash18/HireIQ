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

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="resume">Resume</label><br />
                <input type="file" name="resume" id="resume" onChange={handleInput} required /><br /><br />
                <label htmlFor="jd">Job Description</label><br />
                <textarea name="jd" id="jd" value={formData.jd} onChange={handleInput} required></textarea><br /><br /><br />
                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Analysing..." : "Check Similarity"}
                </button>
            </form>

            {error && <p>{error}</p>}

            {result && <div id="result" >
                <p>Fit score : {(result.fit_score * 100).toFixed(0)}%</p>
                <p>Matched skills : {result.matchedSkills.join(", ")}</p>
                <p>Missing skills : {result.missingSkills.join(", ")}</p>
            </div>}
        </div>
    )
}