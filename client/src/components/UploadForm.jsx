import { useState } from "react";

export default function UploadForm() {
    let [formData, setFormData] = useState({
        resume: null,
        jd: ""
    });

    let handleInput = (event) => {
        let value = event.target.type === "file" ? event.target.files[0] : event.target.value;
        setFormData((currData) => {
            return { ...currData, [event.target.name]: value }
        })
    }

    let handleSubmit = (event) => {
        event.preventDefault();
        console.log(formData);
        setFormData({
            resume: null,
            jd: ""
        })
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="resume">Resume</label><br />
                <input type="file" name="resume" id="resume" onChange={handleInput} required /><br /><br />
                <label htmlFor="jd">Job Description</label><br />
                <textarea name="jd" id="jd" value={formData.jd} onChange={handleInput} required></textarea><br /><br /><br />
                <button type="submit">Check Similarity</button>
            </form>
        </div>
    )
}