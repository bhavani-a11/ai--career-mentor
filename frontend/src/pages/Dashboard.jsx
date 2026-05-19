import { Link } from "react-router-dom";

const features = [
  {
    title: "Resume Analyzer",
    description: "Get an ATS score and AI-powered suggestions to improve your resume.",
    icon: "📄",
    path: "/resume-analyzer",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Resume Editor",
    description: "Edit your resume sections and download a professional PDF.",
    icon: "✏️",
    path: "/resume-editor",
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Job Matching",
    description: "Compare your resume against a job description to see how well you match.",
    icon: "🎯",
    path: "/job-matching",
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "Skill Analyzer",
    description: "Discover your skill gaps and get recommendations for what to learn next.",
    icon: "💡",
    path: "/skill-analyzer",
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Mock Interview",
    description: "Practice your interview skills with our AI HR/Tech interviewer.",
    icon: "🎤",
    path: "/mock-interview",
    color: "from-red-500 to-rose-600",
  },
  {
    title: "Roadmap Generator",
    description: "Generate a step-by-step learning path to land your dream job.",
    icon: "🗺️",
    path: "/roadmap",
    color: "from-cyan-500 to-teal-600",
  },
  {
    title: "AI Career Mentor",
    description: "Have a conversation with our AI about careers, skills, and professional development.",
    icon: "💬",
    path: "/chat",
    color: "from-slate-500 to-gray-600",
  },
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to AI Career Mentor
        </h1>
        <p className="text-xl text-gray-600">
          Your all-in-one platform for career development, powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.path}
            className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
