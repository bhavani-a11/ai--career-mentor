import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Chat", path: "/chat" },
    { name: "Resume Analyzer", path: "/resume-analyzer" },
    { name: "Resume Editor", path: "/resume-editor" },
    { name: "Job Matching", path: "/job-matching" },
    { name: "Mock Interview", path: "/mock-interview" },
    { name: "Skill Analyzer", path: "/skill-analyzer" },
    { name: "Roadmap Generator", path: "/roadmap" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          AI Career Mentor
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-gray-500 text-center">
        Powered by GitHub Models
      </div>
    </div>
  );
}
