import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const defaultResumeData = {
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

export default function ResumeEditorPage() {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: defaultResumeData,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const resumeData = watch();

  function addExperience() {
    const currentExperience = resumeData.experience || [];
    setValue("experience", [
      ...currentExperience,
      {
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  }

  function removeExperience(index) {
    const currentExperience = resumeData.experience || [];
    setValue(
      "experience",
      currentExperience.filter((_, i) => i !== index)
    );
  }

  function addEducation() {
    const currentEducation = resumeData.education || [];
    setValue("education", [
      ...currentEducation,
      {
        school: "",
        degree: "",
        startDate: "",
        endDate: "",
      },
    ]);
  }

  function removeEducation(index) {
    const currentEducation = resumeData.education || [];
    setValue(
      "education",
      currentEducation.filter((_, i) => i !== index)
    );
  }

  async function downloadPDF() {
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Resume Editor</h1>
          <p className="text-gray-600">
            Edit your resume sections and generate a professional PDF.
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={isGenerating}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      {...field}
                      type="email"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              />
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              />
              <Controller
                name="linkedin"
                control={control}
                render={({ field }) => (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      {...field}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Professional Summary
            </h2>
            <Controller
              name="summary"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none resize-none"
                />
              )}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Skills</h2>
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
                  placeholder="Enter skills separated by commas"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none resize-none"
                />
              )}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Experience</h2>
              <button
                onClick={addExperience}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-6">
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Experience {index + 1}
                    </h3>
                    {resumeData.experience.length > 1 && (
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
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
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Company
                          </label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.position`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Position
                          </label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.startDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            {...field}
                            type="month"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`experience.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none resize-none text-sm"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Education</h2>
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-6">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Education {index + 1}
                    </h3>
                    {resumeData.education.length > 1 && (
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
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
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            School
                          </label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.degree`}
                      control={control}
                      render={({ field }) => (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Degree
                          </label>
                          <input
                            {...field}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.startDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            {...field}
                            type="month"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name={`education.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            {...field}
                            type="month"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm"
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

        <div className="sticky top-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Preview</h2>
            <div
              id="resume-preview"
              className="bg-white border border-gray-200 rounded-lg p-8"
              style={{ maxWidth: "8.5in", margin: "0 auto" }}
            >
              <div className="text-center mb-6 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {resumeData.name}
                </h1>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                  {resumeData.email && <span>{resumeData.email}</span>}
                  {resumeData.phone && <span>{resumeData.phone}</span>}
                  {resumeData.location && <span>{resumeData.location}</span>}
                  {resumeData.linkedin && <span>{resumeData.linkedin}</span>}
                </div>
              </div>

              {resumeData.summary && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
                    Professional Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {resumeData.skills && resumeData.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resumeData.experience && resumeData.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {exp.position}
                            </h3>
                            <p className="text-gray-700">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-600">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="mt-2 text-gray-700 text-sm leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumeData.education && resumeData.education.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">
                    Education
                  </h2>
                  <div className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {edu.school}
                            </h3>
                            <p className="text-gray-700">{edu.degree}</p>
                          </div>
                          <span className="text-sm text-gray-600">
                            {edu.startDate} - {edu.endDate}
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
  );
}
