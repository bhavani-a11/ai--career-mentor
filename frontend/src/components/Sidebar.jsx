import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

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
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-xl justify-between">
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            AI Career Mentor
          </h1>
        </div>
        <nav className="px-4 space-y-2 mt-4">
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
      </div>

      <div className="p-4 border-t border-gray-800 space-y-3">
        {user && (
          <div className="px-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-sm font-bold text-gray-200 truncate mt-0.5">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/40 hover:bg-red-800/80 text-red-200 hover:text-white font-bold rounded-lg border border-red-800/30 transition-all text-sm"
        >
          Log Out
        </button>
        <div className="text-[10px] text-gray-500 text-center pt-2">
          Powered by GitHub Models & MongoDB
        </div>
      </div>
    </div>
  );
}
