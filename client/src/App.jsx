
import './App.css'
import UploadForm from './components/UploadForm'
import History from './components/History'

function App() {
  return (
    <div className="app-container">
      <div className="hero">
        <h1 id="title">HireIQ</h1>

        <p className="subtitle">
          Compare your resume against any job description and
          instantly discover your fit score, matching skills,
          and skill gaps.
        </p>
      </div>

      <UploadForm />

      <History />
    </div>
  );
}

export default App;
