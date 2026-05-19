import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzerPage";
import ResumeEditorPage from "./pages/ResumeEditorPage";
import JobMatchingPage from "./pages/JobMatchingPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import SkillAnalyzerPage from "./pages/SkillAnalyzerPage";
import RoadmapGeneratorPage from "./pages/RoadmapGeneratorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
          <Route path="/resume-editor" element={<ResumeEditorPage />} />
          <Route path="/job-matching" element={<JobMatchingPage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/skill-analyzer" element={<SkillAnalyzerPage />} />
          <Route path="/roadmap" element={<RoadmapGeneratorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
