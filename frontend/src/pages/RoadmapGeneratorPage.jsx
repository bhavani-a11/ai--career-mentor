import { useState } from "react";
import api from "../services/api";
import LoadingDots from "../components/LoadingDots";

export default function RoadmapGeneratorPage() {
  const [targetRole, setTargetRole] = useState("");
  const [currentExperience, setCurrentExperience] = useState("Beginner");
  const [timeline, setTimeline] = useState("6 months");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/roadmap/generate", {
        target_role: targetRole,
        current_experience: currentExperience,
        timeline: timeline,
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to generate roadmap"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Roadmap Generator
      </h1>
      <p className="text-gray-600 mb-8">
        Generate a step-by-step learning path to land your dream job.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Experience Level
            </label>
            <select
              value={currentExperience}
              onChange={(e) => setCurrentExperience(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="Beginner">Beginner (0-1 year)</option>
              <option value="1-2 years">1-2 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5+ years">5+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Desired Timeline
            </label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="2 years">2 years</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!targetRole.trim() || loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingDots /> Generating...
              </span>
            ) : (
              "Generate Roadmap"
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Your Learning Roadmap
              </h2>
              <p className="text-gray-600">
                Target: <span className="font-semibold text-blue-600">{result.target_role}</span> • Timeline:{" "}
                <span className="font-semibold text-blue-600">{result.timeline}</span>
              </p>
            </div>

            <div className="space-y-6">
              {result.steps.map((step, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-6 pb-6 last:pb-0"
                >
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {step.phase}
                      </h3>
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                        {step.duration}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Goals
                        </h4>
                        <ul className="space-y-1">
                          {step.goals.map((goal, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className="text-blue-500 mt-1">✓</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Topics to Learn
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {step.topics.map((topic, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Recommended Resources
                        </h4>
                        <ul className="space-y-1">
                          {step.resources.map((resource, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-700"
                            >
                              <span className="text-green-500 mt-1">📚</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 text-center">
              <button
                onClick={() => setResult(null)}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Generate Another Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
