import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import api from "../services/api";

const defaultResumeData = {
  title: "Untitled Resume",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "(555) 123-4567",
  location: "New York, NY",
  linkedin: "linkedin.com/in/johndoe",
  summary:
    "Experienced software engineer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies.",
  skills: ["JavaScript", "React", "Node.js", "Python", "Git", "SQL"],
  experience: [
    {
      company: "Tech Company Inc.",
      position: "Senior Software Engineer",
      startDate: "2021-01",
      endDate: "Present",
      description:
        "Led development of core product features, improved performance by 40%, and mentored junior developers.",
    },
    {
      company: "Startup XYZ",
      position: "Software Engineer",
      startDate: "2019-01",
      endDate: "2020-12",
      description:
        "Built and maintained RESTful APIs, developed responsive UI components, and collaborated with product team.",
    },
  ],
  education: [
    {
      school: "University of Technology",
      degree: "Bachelor of Science in Computer Science",
      startDate: "2015-08",
      endDate: "2019-05",
    },
  ],
};

const blankResumeData = {
  title: "New Resume",
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  summary: "",
  skills: [],
  experience: [{ company: "", position: "", startDate: "", endDate: "", description: "" }],
  education: [{ school: "", degree: "", startDate: "", endDate: "" }],
};

export default function ResumeEditorPage() {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultResumeData,
  });

  const resumeData = watch();

  // Component States
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [template, setTemplate] = useState("modern");
  const [atsScore, setAtsScore] = useState(null);
  const [atsSuggestions, setAtsSuggestions] = useState([]);
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [jdText, setJdText] = useState("");

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [isSkillsGenerating, setIsSkillsGenerating] = useState(false);
  const [isDescriptionGenerating, setIsDescriptionGenerating] = useState({});
  const [isTailoring, setIsTailoring] = useState(false);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);

  // Fetch all saved resumes on load
  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    try {
      const response = await api.get("/resumes");
      setSavedResumes(response.data);
    } catch (error) {
      console.error("Error loading resumes:", error);
    }
  }

  // Handle Loading/Editing an Existing Resume
  async function handleLoadResume(id) {
    if (!id) {
      setSelectedResumeId("");
      reset(blankResumeData);
      setAtsScore(null);
      setSuggestedSkills([]);
      return;
    }

    try {
      const response = await api.get(`/resumes/${id}`);
      setSelectedResumeId(id);
      reset(response.data);
      setAtsScore(null);
      setSuggestedSkills([]);
    } catch (error) {
      console.error("Error fetching resume details:", error);
      alert("Failed to load resume details.");
    }
  }

  // Reset to completely NEW resume
  function handleNewResume() {
    setSelectedResumeId("");
    reset(blankResumeData);
    setAtsScore(null);
    setSuggestedSkills([]);
  }

  // Save current resume (New or Update)
  async function handleSaveResume() {
    setIsSaving(true);
    try {
      const payload = { ...resumeData };
      if (selectedResumeId) {
        payload._id = selectedResumeId;
      }
      
      const response = await api.post("/resumes", payload);
      const savedDoc = response.data;
      setSelectedResumeId(savedDoc._id);
      
      alert("Resume saved successfully!");
      fetchResumes();
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume. Please ensure you are logged in.");
    } finally {
      setIsSaving(false);
    }
  }

  // Delete Resume
  async function handleDeleteResume() {
    if (!selectedResumeId) return;
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/resumes/${selectedResumeId}`);
      alert("Resume deleted successfully!");
      handleNewResume();
      fetchResumes();
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume.");
    } finally {
      setIsDeleting(false);
    }
  }

  // AI-Generated Professional Summary
  async function generateSummary() {
    setIsSummaryGenerating(true);
    try {
      const response = await api.post("/resumes/improve-summary", {
        experience: resumeData.experience,
        skills: resumeData.skills,
      });
      setValue("summary", response.data.summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to generate summary with AI.");
    } finally {
      setIsSummaryGenerating(false);
    }
  }

  // AI Skill Suggestions
  async function loadSkillSuggestions() {
    setIsSkillsGenerating(true);
    try {
      const response = await api.post("/resumes/suggest-skills", {
        experience: resumeData.experience,
        skills: resumeData.skills,
      });
      setSuggestedSkills(response.data.suggested_skills || []);
    } catch (error) {
      console.error("Error generating skill suggestions:", error);
      alert("Failed to load skill suggestions.");
    } finally {
      setIsSkillsGenerating(false);
    }
  }

  function addSuggestedSkill(skill) {
    const currentSkills = resumeData.skills || [];
    if (!currentSkills.includes(skill)) {
      setValue("skills", [...currentSkills, skill]);
      setSuggestedSkills(suggestedSkills.filter((s) => s !== skill));
    }
  }

  // AI-Improved Project Descriptions (per item index)
  async function improveExperienceDescription(index) {
    const currentDesc = resumeData.experience[index]?.description;
    if (!currentDesc) {
      alert("Please enter a basic experience description first.");
      return;
    }

    setIsDescriptionGenerating((prev) => ({ ...prev, [index]: true }));
    try {
      const response = await api.post("/resumes/improve-description", {
        description: currentDesc,
      });
      setValue(`experience.${index}.description`, response.data.description);
    } catch (error) {
      console.error("Error improving description:", error);
      alert("Failed to polish experience description.");
    } finally {
      setIsDescriptionGenerating((prev) => ({ ...prev, [index]: false }));
    }
  }

  // Calculate ATS score & feedback
  async function checkAtsScore() {
    setIsScoring(true);
    try {
      const response = await api.post("/resumes/score", {
        resume: resumeData,
      });
      setAtsScore(response.data.score);
      setAtsSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Error checking ATS score:", error);
      alert("Failed to score resume.");
    } finally {
      setIsScoring(false);
    }
  }

  // Tailor Resume dynamically based on Job Description
  async function tailorResumeToJd() {
    if (!jdText) {
      alert("Please paste the Job Description first.");
      return;
    }

    setIsTailoring(true);
    try {
      const response = await api.post("/resumes/generate-from-jd", {
        resume: resumeData,
        jd: jdText,
      });
      reset(response.data);
      setAtsScore(null);
      setSuggestedSkills([]);
      alert("Resume tailored successfully based on Job Description!");
    } catch (error) {
      console.error("Error tailoring resume:", error);
      alert("Failed to tailor resume to the Job Description.");
    } finally {
      setIsTailoring(false);
    }
  }

  // jsPDF download engine
  async function downloadPDF() {
    setIsPDFGenerating(true);
    const resumeElement = document.getElementById("resume-preview");

    try {
      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${resumeData.name || "resume"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsPDFGenerating(false);
    }
  }

  // Dynamic Array Modifiers
  function addExperience() {
    const current = resumeData.experience || [];
    setValue("experience", [
      ...current,
      { company: "", position: "", startDate: "", endDate: "", description: "" },
    ]);
  }

  function removeExperience(index) {
    const current = resumeData.experience || [];
    setValue("experience", current.filter((_, i) => i !== index));
  }

  function addEducation() {
    const current = resumeData.education || [];
    setValue("education", [...current, { school: "", degree: "", startDate: "", endDate: "" }]);
  }

  function removeEducation(index) {
    const current = resumeData.education || [];
    setValue("education", current.filter((_, i) => i !== index));
  }

  // Dynamic Template styling maps
  const getTemplateStyles = () => {
    switch (template) {
      case "minimalist":
        return {
          container: "font-serif text-gray-800 p-8",
          header: "text-center mb-8 border-b-2 border-gray-200 pb-4",
          name: "text-3xl font-normal tracking-wide uppercase mb-1",
          sectionTitle: "text-base font-bold tracking-widest uppercase border-b border-gray-400 pb-1 mb-4 mt-6",
          bullet: "px-2 py-0.5 bg-transparent border border-gray-300 text-gray-700 rounded text-xs",
        };
      case "executive":
        return {
          container: "font-sans text-gray-900 p-10",
          header: "text-center mb-8 pb-4",
          name: "text-4xl font-serif font-semibold text-slate-800 mb-1",
          sectionTitle: "text-sm font-extrabold text-slate-800 tracking-wider uppercase border-b-2 border-slate-800 pb-1 mb-4 mt-6",
          bullet: "px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-xs border border-slate-200",
        };
      case "creative":
        return {
          container: "font-sans text-slate-800 p-8 border-l-8 border-emerald-500",
          header: "mb-8 pb-4",
          name: "text-4xl font-extrabold text-emerald-800 tracking-tight mb-1",
          sectionTitle: "text-lg font-bold text-emerald-700 pb-1 mb-4 mt-6 border-b border-emerald-100",
          bullet: "px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold",
        };
      case "modern":
      default:
        return {
          container: "font-sans text-gray-800 p-8",
          header: "text-center mb-8 border-b border-gray-300 pb-4",
          name: "text-3xl font-extrabold text-gray-900 mb-2",
          sectionTitle: "text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 mt-5",
          bullet: "px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold",
        };
    }
  };

  const currentStyles = getTemplateStyles();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Resume Builder
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Optimize, style, and download modern AI-tailored resumes.
          </p>
        </div>

        {/* Saved Resumes Select Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedResumeId}
            onChange={(e) => handleLoadResume(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">-- Start from Scratch --</option>
            {savedResumes.map((res) => (
              <option key={res._id} value={res._id}>
                {res.title || "Untitled Resume"}
              </option>
            ))}
          </select>

          <button
            onClick={handleNewResume}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            New
          </button>

          <button
            onClick={handleSaveResume}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-500/10"
          >
            {isSaving ? "Saving..." : "Save Resume"}
          </button>

          {selectedResumeId && (
            <button
              onClick={handleDeleteResume}
              disabled={isDeleting}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ================= LEFT: FORM & CONTROLS ================= */}
        <div className="space-y-6">
          {/* Resume Title Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Resume Document Title
                  </label>
                  <input
                    {...field}
                    placeholder="e.g. Senior Software Engineer - 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-semibold"
                  />
                </div>
              )}
            />
          </div>

          {/* Job Description (JD) Tailor Panel */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              ✨ AI Job Description Tailor
            </h2>
            <p className="text-xs text-indigo-700">
              Paste the target Job Description below. The AI will restyle and rewrite your summary, descriptions, and skills to highlight perfect ATS keyword alignment.
            </p>
            <textarea
              rows={3}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste Job Description / Requirements here..."
              className="w-full px-4 py-3 rounded-xl border border-indigo-200/50 bg-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
            <button
              onClick={tailorResumeToJd}
              disabled={isTailoring || !jdText}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {isTailoring ? "Rewriting Resume with AI..." : "Tailor Resume to Job Description"}
            </button>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    />
                  </div>
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      {...field}
                      type="email"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    />
                  </div>
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    />
                  </div>
                )}
              />
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    />
                  </div>
                )}
              />
              <Controller
                name="linkedin"
                control={control}
                render={({ field }) => (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn</label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Professional Summary</h2>
              <button
                onClick={generateSummary}
                disabled={isSummaryGenerating}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSummaryGenerating ? "Generating summary..." : "✨ AI Summarize"}
              </button>
            </div>
            <Controller
              name="summary"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none text-sm transition-all"
                />
              )}
            />
          </div>

          {/* Skills & AI Skill Suggestion */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Skills</h2>
              <button
                onClick={loadSkillSuggestions}
                disabled={isSkillsGenerating}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSkillsGenerating ? "Suggesting skills..." : "🔍 Suggest Skills"}
              </button>
            </div>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <textarea
                  value={field.value.join(", ")}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s)
                    )
                  }
                  rows={3}
                  placeholder="Enter skills separated by commas (e.g. React, SQL, Python)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none text-sm transition-all"
                />
              )}
            />

            {/* AI Suggested Skill Bubbles */}
            {suggestedSkills.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Recommended Additions (Click to Add):
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill, index) => (
                    <button
                      key={index}
                      onClick={() => addSuggestedSkill(skill)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Experience</h2>
              <button
                onClick={addExperience}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold text-sm transition-colors"
              >
                + Add Experience
              </button>
            </div>
            <div className="space-y-6">
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Experience #{index + 1}</h3>
                    {resumeData.experience.length > 1 && (
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name={`experience.${index}.company`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.position`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Position</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.startDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-gray-600">Description</label>
                            <button
                              onClick={() => improveExperienceDescription(index)}
                              disabled={isDescriptionGenerating[index]}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 hover:text-blue-600 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                              {isDescriptionGenerating[index] ? "Polishing..." : "✨ AI Improve Bullet"}
                            </button>
                          </div>
                          <textarea
                            {...field}
                            rows={3}
                            placeholder="Mentored junior developers, designed scalable UI components, increased performance..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500 resize-none"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Education</h2>
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold text-sm transition-colors"
              >
                + Add Education
              </button>
            </div>
            <div className="space-y-6">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Education #{index + 1}</h3>
                    {resumeData.education.length > 1 && (
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name={`education.${index}.school`}
                      control={control}
                      render={({ field }) => (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">School</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.degree`}
                      control={control}
                      render={({ field }) => (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Degree</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.startDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT: LIVE PREVIEW & TOOLS ================= */}
        <div className="space-y-6 sticky top-8">
          {/* Template & PDF Toolbar */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Preview & Layout</h2>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-600">Template:</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="modern">Modern Professional</option>
                  <option value="minimalist">Minimalist Clean</option>
                  <option value="executive">Executive Classic</option>
                  <option value="creative">Creative Elegant</option>
                </select>
              </div>

              <button
                onClick={downloadPDF}
                disabled={isPDFGenerating}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/10"
              >
                {isPDFGenerating ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </div>

          {/* ATS Analyzer Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">ATS Optimization</h2>
              <button
                onClick={checkAtsScore}
                disabled={isScoring}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {isScoring ? "Checking..." : "Calculate ATS Score"}
              </button>
            </div>

            {atsScore !== null && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="relative w-16 h-16 flex items-center justify-center bg-indigo-600 text-white font-black text-xl rounded-full shadow-lg shadow-indigo-600/20">
                    {atsScore}%
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Resume ATS Rating</h4>
                    <p className="text-xs text-gray-500">
                      Based on keyword density, summary impact, and skill count.
                    </p>
                  </div>
                </div>

                {atsSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actionable Recommendations:
                    </p>
                    <ul className="space-y-1.5">
                      {atsSuggestions.map((suggestion, index) => (
                        <li key={index} className="text-xs text-gray-700 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-indigo-500 font-bold">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Stylized Resume Preview */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Live Document Preview (A4 Formatted)
              </span>
            </div>
            
            <div className="overflow-auto bg-gray-100 p-8">
              <div
                id="resume-preview"
                className={`bg-white shadow-sm border border-gray-300 mx-auto transition-all ${currentStyles.container}`}
                style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box" }}
              >
                {/* Header Section */}
                <div className={currentStyles.header}>
                  <h1 className={currentStyles.name}>{resumeData.name || "YOUR NAME"}</h1>
                  <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 mt-1">
                    {resumeData.email && <span>{resumeData.email}</span>}
                    {resumeData.phone && <span>{resumeData.phone}</span>}
                    {resumeData.location && <span>{resumeData.location}</span>}
                    {resumeData.linkedin && <span>{resumeData.linkedin}</span>}
                  </div>
                </div>

                {/* Summary Section */}
                {resumeData.summary && (
                  <div className="mb-6">
                    <h2 className={currentStyles.sectionTitle}>Professional Summary</h2>
                    <p className="text-xs leading-relaxed text-gray-700">{resumeData.summary}</p>
                  </div>
                )}

                {/* Skills Section */}
                {resumeData.skills && resumeData.skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className={currentStyles.sectionTitle}>Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill, index) => (
                        <span key={index} className={currentStyles.bullet}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {resumeData.experience && resumeData.experience.length > 0 && (
                  <div className="mb-6">
                    <h2 className={currentStyles.sectionTitle}>Experience</h2>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-bold text-gray-800">{exp.position || "Position Title"}</h3>
                              <p className="text-xs text-gray-600 font-medium">{exp.company || "Company Name"}</p>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">
                              {exp.startDate || "Start"} - {exp.endDate || "Present"}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-[11px] text-gray-600 leading-relaxed pl-1 whitespace-pre-line">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {resumeData.education && resumeData.education.length > 0 && (
                  <div>
                    <h2 className={currentStyles.sectionTitle}>Education</h2>
                    <div className="space-y-3">
                      {resumeData.education.map((edu, index) => (
                        <div key={index} className="space-y-0.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-bold text-gray-800">{edu.school || "University/School"}</h3>
                              <p className="text-xs text-gray-600 font-medium">{edu.degree || "Degree Detail"}</p>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">
                              {edu.startDate || "Start"} - {edu.endDate || "End"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
