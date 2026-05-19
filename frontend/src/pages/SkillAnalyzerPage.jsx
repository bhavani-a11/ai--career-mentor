import { useState } from "react";
import api from "../services/api";
import LoadingDots from "../components/LoadingDots";

export default function SkillAnalyzerPage() {
  const [targetRole, setTargetRole] = useState("");
  const [currentSkillsInput, setCurrentSkillsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function parseSkills(input) {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const currentSkills = parseSkills(currentSkillsInput);
    if (!targetRole.trim() || currentSkills.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/skill/analyze", {
        target_role: targetRole,
        current_skills: currentSkills,
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to analyze skills"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Skill Analyzer</h1>
      <p className="text-gray-600 mb-8">
        Discover your skill gaps for your dream role and get personalized recommendations.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="target-role"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Target Job Role
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="current-skills"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Your Current Skills (comma-separated)
            </label>
            <textarea
              id="current-skills"
              value={currentSkillsInput}
              onChange={(e) => setCurrentSkillsInput(e.target.value)}
              rows={4}
              placeholder="e.g., JavaScript, React, Python, Git, SQL"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!targetRole.trim() || !currentSkillsInput.trim() || loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingDots /> Analyzing...
              </span>
            ) : (
              "Analyze Skills"
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 text-white">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{result.skill_level}</div>
                <div className="text-sm opacity-90">Overall Level</div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Skill Analysis Complete</h2>
                <p className="opacity-90">
                  Here's what you need to focus on to reach your goal.
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
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Suggestions
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
                Learning Resources
              </h3>
              <ul className="space-y-2">
                {result.learning_resources.map((resource, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-blue-500 mt-1">📚</span>
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Analyze Another Skill Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
