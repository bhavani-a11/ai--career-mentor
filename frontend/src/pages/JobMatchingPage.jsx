import { useState } from "react";
import api from "../services/api";
import LoadingDots from "../components/LoadingDots";

export default function JobMatchingPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/job/match", {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to match job"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Job Description Matching
      </h1>
      <p className="text-gray-600 mb-8">
        Compare your resume against a job description to see how well you match.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Resume Text
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              placeholder="Paste your resume text here..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              placeholder="Paste the job description here..."
            />
          </div>

          <button
            type="submit"
            disabled={!resumeText.trim() || !jobDescription.trim() || loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingDots /> Analyzing...
              </span>
            ) : (
              "Match Resume to Job"
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{result.match_score}</div>
                <div className="text-sm opacity-90">Match Score / 100</div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Match Analysis Complete</h2>
                <p className="opacity-90">
                  {result.match_score >= 80
                    ? "Excellent match! You're a strong candidate."
                    : result.match_score >= 60
                    ? "Good match! There are some areas to highlight."
                    : "You have some gaps. Consider tailoring your resume."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Your Strengths
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Gaps to Address
              </h3>
              <ul className="space-y-2">
                {result.gaps.map((gap, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Recommendations
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-amber-500 mt-1">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Keywords Matched
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keyword_matches.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Analyze Another Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
