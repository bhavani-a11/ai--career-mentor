import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import LoadingDots from "../components/LoadingDots";

export default function MockInterviewPage() {
  const [step, setStep] = useState("setup");
  const [mode, setMode] = useState("HR");
  const [role, setRole] = useState("");
  const [history, setHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function startInterview() {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/interview/start", { mode, role });
      setCurrentQuestion(response.data.first_question);
      setHistory(response.data.history);
      setStep("interview");
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to start interview"
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/interview/answer", {
        mode,
        role,
        answer,
        history,
      });

      setScore(response.data.score);
      setFeedback(response.data.feedback);
      setSuggestions(response.data.suggestions);
      setHistory(response.data.history);

      if (response.data.next_question) {
        setCurrentQuestion(response.data.next_question);
        setAnswer("");
      } else {
        setStep("complete");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to submit answer"
      );
    } finally {
      setLoading(false);
    }
  }

  function resetInterview() {
    setStep("setup");
    setMode("HR");
    setRole("");
    setHistory([]);
    setCurrentQuestion("");
    setAnswer("");
    setScore(0);
    setFeedback("");
    setSuggestions("");
    setError(null);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Mock Interview</h1>
      <p className="text-gray-600 mb-8">
        Practice your interview skills with our AI HR/Tech interviewer.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {step === "setup" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interview Mode
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode("HR")}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    mode === "HR"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  HR Interview
                </button>
                <button
                  onClick={() => setMode("Technical")}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    mode === "Technical"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Technical Interview
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="role-input"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Target Job Role
              </label>
              <input
                id="role-input"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <button
              onClick={startInterview}
              disabled={!role.trim() || loading}
              className="w-full px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingDots /> Starting...
                </span>
              ) : (
                "Start Interview"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "interview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {mode} Interview for {role}
              </h2>
              <button
                onClick={resetInterview}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Start Over
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  Interviewer
                </p>
                <p className="text-gray-800">{currentQuestion}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Type your answer here..."
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={resetInterview}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || loading}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <LoadingDots /> Submitting...
                    </span>
                  ) : (
                    "Submit Answer"
                  )}
                </button>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-8 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Previous Answer Feedback</h3>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{score}</span>
                    <span className="text-sm text-blue-500 ml-1">/10</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Feedback</h4>
                  <p className="text-gray-700">{feedback}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Suggestions</h4>
                  <p className="text-gray-700">{suggestions}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "complete" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
            <p className="opacity-90">Great job practicing your interview skills.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-blue-600">{score}</span>
                <span className="text-lg text-blue-500 ml-2">/10</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Final Feedback</h3>
              <p className="text-gray-700">{feedback}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Key Suggestions</h3>
              <p className="text-gray-700">{suggestions}</p>
            </div>
            <button
              onClick={resetInterview}
              className="w-full px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start Another Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
