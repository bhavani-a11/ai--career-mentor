import { useEffect, useRef, useState } from "react";
import LoadingDots from "../components/LoadingDots";
import { sendChatMessage } from "../services/chatApi";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm your AI Career Mentor. Ask me about careers, skills, resumes, or interview prep.",
};

function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }
  if (error.message === "Network Error") {
    return "Cannot reach the server. Is the backend running on port 8001?";
  }
  return error.message || "Something went wrong. Please try again.";
}

export default function ChatPage() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">AI Career Mentor</h1>
        <p className="mt-0.5 text-sm text-slate-500">Powered by Gemini via FastAPI</p>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                    msg.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-800",
                  ].join(" ")}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-2xl bg-slate-100 px-4 py-2">
                  <LoadingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex shrink-0 gap-2 border-t border-slate-200 p-4"
          >
            <label htmlFor="chat-input" className="sr-only">
              Your message
            </label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your career mentor..."
              disabled={loading}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
