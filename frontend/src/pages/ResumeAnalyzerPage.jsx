import { useState } from "react";
import api from "../services/api";
import LoadingDots from "../components/LoadingDots";

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to analyze resume"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Resume Analyzer</h1>
      <p className="text-gray-600 mb-8">
        Upload your resume to get an ATS score and AI-powered improvement suggestions.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="resume-upload"
            disabled={loading}
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer block"
          >
            {file ? (
              <div>
                <p className="text-lg font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">Click to change file</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Click to upload your resume
                </p>
                <p className="text-sm text-gray-500">PDF files only (max 10 MB)</p>
              </div>
            )}
          </label>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingDots /> Analyzing...
              </span>
            ) : (
              "Analyze Resume"
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{result.ats_score}</div>
                <div className="text-sm opacity-90">ATS Score / 100</div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Resume Analysis Complete</h2>
                <p className="opacity-90">
                  {result.ats_score >= 80
                    ? "Great job! Your resume is well-optimized."
                    : result.ats_score >= 60
                    ? "Not bad! There are some areas to improve."
                    : "Your resume needs significant improvements for ATS compatibility."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Weak Sections
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.weak_sections.map((section, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Suggestions for Improvement
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Recommended Technologies to Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.recommended_tech.map((tech, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
