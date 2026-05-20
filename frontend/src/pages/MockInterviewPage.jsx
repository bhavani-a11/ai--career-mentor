import "regenerator-runtime/runtime";
import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import api from "../services/api";

export default function MockInterviewPage() {
  const [step, setStep] = useState("setup");
  const [mode, setMode] = useState("Technical");
  const [role, setRole] = useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [showWebcam, setShowWebcam] = useState(true);

  // Conversational & Flow States
  const [history, setHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);

  // Evaluation & Results States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");
  
  // Dashboard Analytics
  const [report, setReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [savedHistory, setSavedHistory] = useState([]);

  // Speech Recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Keep answer in sync with speech transcription
  useEffect(() => {
    if (transcript) {
      setAnswer(transcript);
    }
  }, [transcript]);

  // Interval hook for the interview question timer
  useEffect(() => {
    let timer;
    if (step === "interview") {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Load previous interview scores on startup
  useEffect(() => {
    loadSavedReports();
  }, []);

  async function loadSavedReports() {
    try {
      const response = await api.get("/interview/history");
      setSavedHistory(response.data);
    } catch (err) {
      console.error("Failed to load interview history", err);
    }
  }

  // Text-To-Speech: Make the AI speak
  function speakText(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Select standard English voice if available
      const enVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Microphone listeners
  function toggleMicrophone() {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setAnswer("");
      SpeechRecognition.startListening({ continuous: true });
    }
  }

  // Start the interview
  async function startInterview() {
    if (!role.trim()) return;
    setLoading(true);
    setError(null);
    setQuestionNumber(1);

    try {
      const response = await api.post("/interview/start", {
        mode,
        role,
        experience_level: experienceLevel,
      });

      const firstQ = response.data.first_question;
      setCurrentQuestion(firstQ);
      setHistory(response.data.history);
      setStep("interview");
      setAnswer("");
      resetTranscript();
      
      // AI speaks the first question
      setTimeout(() => speakText(firstQ), 500);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to start the interview."
      );
    } finally {
      setLoading(false);
    }
  }

  // Submit Answer & Fetch Next Question
  async function submitAnswer() {
    if (!answer.trim()) return;
    setLoading(true);
    setError(null);
    
    // Stop recording speech if active
    if (listening) {
      SpeechRecognition.stopListening();
    }

    try {
      const response = await api.post("/interview/answer", {
        mode,
        role,
        experience_level: experienceLevel,
        answer,
        history,
      });

      setScore(response.data.score);
      setFeedback(response.data.feedback);
      setSuggestions(response.data.suggestions);
      setHistory(response.data.history);

      const nextQ = response.data.next_question;
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setAnswer("");
        setQuestionNumber((prev) => prev + 1);
        resetTranscript();
        
        // AI speaks the next question
        setTimeout(() => speakText(nextQ), 500);
      } else {
        // AI has asked all questions, trigger the report generation
        setStep("processing");
        generateFinalReport(response.data.history);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to submit answer."
      );
    } finally {
      setLoading(false);
    }
  }

  // Generate final performance analysis debrief report
  async function generateFinalReport(dialogueHistory) {
    setIsGeneratingReport(true);
    try {
      const response = await api.post("/interview/report", {
        role,
        mode,
        experience_level: experienceLevel,
        history: dialogueHistory,
      });
      setReport(response.data);
      setStep("complete");
    } catch (err) {
      setError("Failed to generate comprehensive performance debrief.");
      setStep("complete");
    } finally {
      setIsGeneratingReport(false);
    }
  }

  // Save Complete Scorecard to MongoDB
  async function saveReportToMongoDB() {
    if (!report) return;
    setIsSavingReport(true);
    try {
      await api.post("/interview/save", {
        role,
        mode,
        experience_level: experienceLevel,
        overall_score: report.overall_score,
        technical_score: report.technical_score,
        communication_score: report.communication_score,
        confidence_score: report.confidence_score,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        suggestions: report.suggestions,
        history,
      });
      alert("Performance scorecard successfully saved to MongoDB!");
      loadSavedReports();
    } catch (err) {
      console.error(err);
      alert("Failed to save scorecard.");
    } finally {
      setIsSavingReport(false);
    }
  }

  function resetInterview() {
    setStep("setup");
    setHistory([]);
    setCurrentQuestion("");
    setAnswer("");
    setScore(0);
    setFeedback("");
    setSuggestions("");
    setReport(null);
    setError(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header block */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Interactive AI Interviewer
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Conduct life-like speech-driven Technical & HR mock interviews.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium animate-fadeIn">
          ⚠️ {error}
        </div>
      )}

      {/* 2. Setup Step */}
      {step === "setup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Settings panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3">
              Configure Your Interview Session
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer, React Developer"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 font-semibold"
                >
                  <option value="Junior">Junior (Entry-level)</option>
                  <option value="Mid-Level">Mid-Level (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Interview Type</label>
                <div className="flex flex-wrap gap-3">
                  {["Technical", "HR", "Mixed"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMode(type)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1 ${
                        mode === type
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {type === "Mixed" ? "Mixed (HR + Tech)" : `${type} Interview`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Webcam Interview Assist</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check posture, presence, and video feedback as you practice speaking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWebcam(!showWebcam)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-colors ${
                  showWebcam ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {showWebcam ? "Webcam Enabled" : "Webcam Disabled"}
              </button>
            </div>

            <button
              onClick={startInterview}
              disabled={loading || !role.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              {loading ? "Preparing Interview Suite..." : "Begin Live Practice"}
            </button>
          </div>

          {/* History Sidebar */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
              Previous Scorecards
            </h3>
            {savedHistory.length === 0 ? (
              <p className="text-xs text-gray-400">No completed interviews recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {savedHistory.map((reportItem) => (
                  <div
                    key={reportItem._id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => {
                      setReport({
                        overall_score: reportItem.overall_score,
                        technical_score: reportItem.technical_score,
                        communication_score: reportItem.communication_score,
                        confidence_score: reportItem.confidence_score,
                        strengths: reportItem.strengths,
                        weaknesses: reportItem.weaknesses,
                        suggestions: reportItem.suggestions,
                      });
                      setHistory(reportItem.history || []);
                      setRole(reportItem.role);
                      setMode(reportItem.mode);
                      setExperienceLevel(reportItem.experience_level);
                      setStep("complete");
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 truncate block max-w-[140px]">
                        {reportItem.role}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                        {reportItem.overall_score}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>{reportItem.mode} • {reportItem.experience_level}</span>
                      <span>{new Date(reportItem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Live Interview Step */}
      {step === "interview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Interview Box */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Question {questionNumber} of 4
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  ⏱️ {formatTimer(seconds)}
                </span>
                <button
                  onClick={resetInterview}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  Quit Session
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Question panel */}
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                    Interviewer Question
                  </span>
                  <button
                    onClick={() => speakText(currentQuestion)}
                    className="p-1 bg-white border border-blue-200 rounded text-blue-600 hover:bg-blue-50 text-[10px] font-bold"
                  >
                    🔊 Read Question
                  </button>
                </div>
                <p className="text-gray-800 font-medium text-lg leading-relaxed">
                  {currentQuestion}
                </p>
              </div>

              {/* Answer submission */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">Your Answer</label>
                  {browserSupportsSpeechRecognition ? (
                    <button
                      onClick={toggleMicrophone}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        listening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      🎤 {listening ? "Recording Voice..." : "Speak Answer (Mic)"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Microphone not supported by browser.</span>
                  )}
                </div>
                
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  placeholder="Record your voice or type your response here..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 text-sm leading-relaxed"
                />
              </div>

              {/* Toolbar */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Analyzing..." : questionNumber === 4 ? "Finish Interview" : "Submit & Next Question"}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar (Webcam Feed) */}
          <div className="space-y-6">
            {showWebcam && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Live Video Feed
                  </span>
                  <button
                    onClick={() => setShowWebcam(false)}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                  >
                    Hide
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden aspect-video border border-gray-200 shadow-inner">
                  <Webcam audio={false} mirrored={true} className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Inline feedback if answering */}
            {feedback && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-3 animate-fadeIn">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">
                  Last Answer Feedback
                </h3>
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                    Score: {score}/10
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{feedback}</p>
                {suggestions && (
                  <p className="text-[11px] text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100/50 leading-relaxed">
                    💡 <strong>Tip:</strong> {suggestions}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Processing step */}
      {step === "processing" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm animate-pulse">
            📊
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Generating Scorecard</h2>
            <p className="text-gray-500 text-sm mt-1">
              Analyzing conversational flows, communication quality, technical accuracy, and confidence cues. Please stand by...
            </p>
          </div>
        </div>
      )}

      {/* 5. Complete / Report Dashboard Step */}
      {step === "complete" && report && (
        <div className="space-y-8 animate-fadeIn">
          {/* Scores Overview Row */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded-full tracking-wider">
                  Debriefing Dashboard
                </span>
                <h2 className="text-3xl font-extrabold mt-3">{role} Mock Interview</h2>
                <p className="text-white/80 text-sm mt-1">
                  Completed {mode} evaluation scorecard.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20 text-3xl font-black">
                    {report.overall_score}%
                  </div>
                  <span className="text-xs font-bold tracking-wide mt-2">Overall Score</span>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Technical Score</h4>
                <p className="text-3xl font-black text-slate-800">{report.technical_score}%</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Communication Score</h4>
                <p className="text-3xl font-black text-slate-800">{report.communication_score}%</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confidence Score</h4>
                <p className="text-3xl font-black text-slate-800">{report.confidence_score}%</p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50">
              <div className="space-y-4">
                <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                  ✅ Primary Strengths
                </h3>
                <ul className="space-y-2">
                  {report.strengths.map((str, i) => (
                    <li key={i} className="text-sm text-gray-700 bg-emerald-50 border border-emerald-100/50 p-3 rounded-xl flex items-start gap-2 shadow-sm">
                      <span className="text-emerald-500 font-extrabold">•</span>
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-rose-800 text-lg flex items-center gap-2">
                  ❌ Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {report.weaknesses.map((weak, i) => (
                    <li key={i} className="text-sm text-gray-700 bg-rose-50 border border-rose-100/50 p-3 rounded-xl flex items-start gap-2 shadow-sm">
                      <span className="text-rose-500 font-extrabold">•</span>
                      {weak}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable coaching recommendations */}
            <div className="p-8 border-t border-gray-100 space-y-4">
              <h3 className="font-bold text-indigo-900 text-lg">💡 Actionable Coaching Pointers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.suggestions.map((sug, i) => (
                  <div key={i} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm text-gray-700 leading-relaxed shadow-sm">
                    {sug}
                  </div>
                ))}
              </div>
            </div>

            {/* Transcript */}
            <div className="p-8 border-t border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-800 text-lg">💬 Complete Dialogue Logs</h3>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {history.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-slate-50 border-gray-200 text-gray-800"
                        : "bg-blue-50/50 border-blue-100 text-blue-900"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      {msg.role === "assistant" ? "Interviewer" : "Candidate Response"}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Toolbar options */}
            <div className="px-8 py-6 bg-slate-50 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <button
                onClick={saveReportToMongoDB}
                disabled={isSavingReport}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-colors shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingReport ? "Saving..." : "Save Scorecard in History"}
              </button>

              <button
                onClick={resetInterview}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/10"
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
