import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Submission } from "../types";
import GlitchText from "./GlitchText";
import emailjs from "@emailjs/browser";

const TARGET_EMAIL = (import.meta as any).env?.VITE_TARGET_EMAIL || "aasthacreateshorror@gmail.com";

export default function SubmissionsSection() {
  const [title, setTitle] = useState("");
  const [penName, setPenName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("flash-fiction");
  const [storyContent, setStoryContent] = useState("");
  const [consented, setConsented] = useState(false);
  const [noAiChecked, setNoAiChecked] = useState(false);
  
  // Local submission history
  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  // File submit states
  const [submissionMethod, setSubmissionMethod] = useState<"type" | "file">("type");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File) => {
    setFileError("");
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["txt", "pdf", "doc", "docx"];
    
    if (!extension || !validExtensions.includes(extension)) {
      setFileError("Forbidden file format! Only .txt, .pdf, .docx, and .doc are accepted.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) { 
      setFileError("File exceeds 20 MB size limit.");
      return;
    }

    setUploadedFile(file);

    // Dynamic extraction preview
    if (extension === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setStoryContent(text || "");
      };
      reader.readAsText(file);
    } else {
      
      setStoryContent(
        `[SEALED MANUSCRIPT ARTIFACT]\n` +
        `Filename: ${file.name}\n` +
        `Format: ${extension.toUpperCase()}\n` +
        `Bytes: ${file.size.toLocaleString()} bytes\n` +
        `Status: Authenticated physically. Ready for transmission.`
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("sub_archives");
    if (saved) {
      try {
        setPastSubmissions(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !penName || !email || !storyContent || !consented || !noAiChecked) {
      alert("Please fill all the details before submitting");
      return;
    }

    if (submissionMethod === "file" && !uploadedFile) {
      alert("Please add a file");
      return;
    }

    setIsTransmitting(true);

    let filePayload: { name: string; content: string; encoding: string } | null = null;
    if (uploadedFile) {
      try {
        const base64Content = await fileToBase64(uploadedFile);
        filePayload = {
          name: uploadedFile.name,
          content: base64Content,
          encoding: "base64"
        };
      } catch (err) {
        alert("Preparing document artifacts failed: " + err);
        setIsTransmitting(false);
        return;
      }
    }

    // Add to Local Vault
    const newSubmission: Submission = {
      id: "sub-" + Date.now(),
      title,
      category,
      penName,
      email,
      storyContent,
      submittedAt: new Date().toLocaleString(),
      consented: true,
      fileName: uploadedFile ? uploadedFile.name : undefined,
      fileSize: uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : undefined
    };

    const updated = [newSubmission, ...pastSubmissions];
    setPastSubmissions(updated);
    localStorage.setItem("sub_archives", JSON.stringify(updated));

    // EmailJS keys from public client environment variables
    const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "";
    const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "";
    const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "";
    const autoReplyTemplateId = (import.meta as any).env?.VITE_EMAILJS_AUTOREPLY_TEMPLATE_ID || "";

    if (!serviceId || !templateId || !publicKey) {
      setTransmissionSuccess(true);
      alert(
        ``
      );

      // Reset form fields
      setTitle("");
      setPenName("");
      setEmail("");
      setStoryContent("");
      setUploadedFile(null);
      setConsented(false);
      setNoAiChecked(false);
      setIsTransmitting(false);
      return;
    }

    try {
      // Map properties to fit typical EmailJS template parameters with robust alias matching
      const templateParams = {
        title,
        pen_name: penName,
        author_email: email,
        category: category.toUpperCase(),
        story_content: storyContent,
        
        // Recipient / Destination Email aliases
        target_email: TARGET_EMAIL,
        to_email: TARGET_EMAIL,
        recipient_email: TARGET_EMAIL,
        recipient: TARGET_EMAIL,
        to_name: "Curation Team",
        to: TARGET_EMAIL,
        
        // Sender info aliases
        from_name: penName,
        from_email: email,
        reply_to: email,
        email: email, // some default templates use {{email}} as sender/inquirer email
        
        // General body aliases
        message: storyContent,

        // File and attachment aliases
        file_name: uploadedFile ? uploadedFile.name : "None",
        file_size: uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : "0 KB",
        file_base64: filePayload ? `data:${uploadedFile?.type || "application/octet-stream"};base64,${filePayload.content}` : "",
        file_raw_base64: filePayload ? filePayload.content : ""
      };

      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);

      if (result.status === 200) {
        // Send automated confirmation auto-reply back to the author if configured
        if (autoReplyTemplateId) {
          try {
            const autoReplyParams = {
              ...templateParams,
              name: penName, // map {{name}} to penName
              email: email,   // map {{email}} to author email for confirmation
              from_name: "Wridrot Team", // override team branding for the reply template
            };
            await emailjs.send(serviceId, autoReplyTemplateId, autoReplyParams, publicKey);
          } catch (autoReplyErr: any) {
            console.warn("Could not dispatch custom auto-reply to author:", autoReplyErr);
          }
        }

        setTransmissionSuccess(true);
        alert(`SUBMISSION COMPLETE!\n\nYour work "${title}" has been sent to us. Thank You for choosing Wridrot.`);

        // Reset form fields
        setTitle("");
        setPenName("");
        setEmail("");
        setStoryContent("");
        setUploadedFile(null);
        setConsented(false);
        setNoAiChecked(false);
      } else {
        alert(`EmailJS returned unhandled status: ${result.status}`);
      }
    } catch (err: any) {
      alert(
        `Critical EmailJS Error: Could not deliver manuscript via electronic socket.\n\n` +
        `Reason: ${err?.text || err?.message || err}\n\n` +
        `Please check that your EmailJS Service ID, Template ID, and Public Key are entered correctly.`
      );
    } finally {
      setIsTransmitting(false);
    }
  };

  const deleteSubmission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to bury this draft forever?")) {
      const updated = pastSubmissions.filter((sub) => sub.id !== id);
      setPastSubmissions(updated);
      localStorage.setItem("sub_archives", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-12" id="submissions-section">
      {/* Overview & Guidelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Spooky Submission Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-horror-blood/40 bg-zinc-950/90 rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-800/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="font-display text-lg text-horror-crimson tracking-widest uppercase mb-4 font-bold flex items-center space-x-2">
              <span>Guidelines </span>
            </h3>

            <ul className="space-y-4 text-xs font-typewriter text-zinc-300 leading-relaxed list-none pl-0">
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Scope of Work:</strong> Submissions should evoke suspense, horror, uncanny anomalies, realism, psychological distress, or related forms of unsettling fiction.
              </li>
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Original Work Only:</strong> Submissions must be the author's original unpublished work and free from plagiarism, unauthorized adaptations, or copyright infringement. 
              </li>
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Zero AI Compliance Rule:</strong> We do not publish AI-generated content. All submissions must be entirely human-written and must not be generated, rewritten, or substantially assisted by artificial intelligence tools.
              </li>
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Content and Theme:</strong> We do not accept works that contain or primarily focus on sexual violence, explicit child abuse, exploitation, fetishistic content, or other forms of abusive sexual material.
              </li>
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Word Limit:</strong> Flash Fiction must be under 1,000 words, while Stories, Folklore, and Creepypasta submissions must not exceed 5,000 words.
              </li>
              <li className="relative pl-5">
                <span className="absolute left-0 text-horror-crimson font-bold">☠</span>
                <strong className="text-zinc-100">Publication Rights:</strong> Authors retain full ownership of their work while granting us a non-exclusive right to publish, archive, and promote the submission across our website and social media platforms.
              </li>
            </ul>
          </div>
        </div>

        {/* Right column: Interactive Submission Form */}
        <div className="lg:col-span-7">
          <div className="horror-card rounded-lg p-6 sm:p-8 relative crt-screen">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600/15 animate-scanline pointer-events-none" />

            <h3 className="font-display text-xl text-white tracking-widest uppercase mb-6 font-bold">
              Submit Your Script
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Grid block for details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Pen Name 
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 focus:border-horror-crimson focus:outline-none p-2.5 rounded transition-all"
                    id="pen-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Your Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. johndoe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 focus:border-horror-crimson focus:outline-none p-2.5 rounded transition-all"
                    id="author-email-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Title of Your Work
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Forbidden Archives"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 focus:border-horror-crimson focus:outline-none p-2.5 rounded transition-all"
                    id="story-title-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                    Script Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 font-mono text-xs border border-zinc-800 focus:border-horror-crimson focus:outline-none p-2.5 rounded transition-all appearance-none cursor-pointer"
                    id="story-category-input"
                  >
                    <option value="flash-fiction">Flash Fiction</option>
                    <option value="story">Story</option>
                    <option value="folklore">Folklore</option>
                    <option value="creepypasta">Creepypasta</option>
                  </select>
                </div>
              </div>

              {/* Submission Method Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                  Your Script
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionMethod("type");
                      setUploadedFile(null);
                      setStoryContent("");
                      setFileError("");
                    }}
                    className={`text-[10px] font-mono py-1.5 uppercase transition-all rounded tracking-wider cursor-pointer ${
                      submissionMethod === "type"
                        ? "bg-horror-blood/40 text-white border border-horror-blood/50 font-bold"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    ⌨ Type it
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionMethod("file");
                      setUploadedFile(null);
                      setStoryContent("");
                      setFileError("");
                    }}
                    className={`text-[10px] font-mono py-1.5 uppercase transition-all rounded tracking-wider cursor-pointer ${
                      submissionMethod === "file"
                        ? "bg-horror-blood/40 text-white border border-horror-blood/50 font-bold"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                    }`}
                  >
                    📂 Attach a File
                  </button>
                </div>
              </div>

              {/* Story Content Area */}
              <div className="space-y-1.5">
                {submissionMethod === "type" ? (
                  <>
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                        Your Script
                      </label>
                      <span className="text-[9px] font-mono text-zinc-600">
                        Characters: {storyContent.length}
                      </span>
                    </div>
                    <textarea
                      required
                      rows={6}
                      placeholder="Once upon a time in an abandoned asylum..."
                      value={storyContent}
                      onChange={(e) => setStoryContent(e.target.value)}
                      className="w-full bg-zinc-950 text-zinc-100 font-typewriter text-xs border border-zinc-800 focus:border-horror-crimson focus:outline-none p-3 rounded transition-all resize-y animate-fadeIn"
                      id="story-content-textarea"
                    />
                  </>
                ) : (
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                      YOUR SCRIPT
                    </label>
                    
                    {!uploadedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded p-6 flex flex-col items-center justify-center transition-all ${
                          isDragging
                            ? "border-horror-crimson bg-horror-blood/10 shadow-2xl scale-[1.01]"
                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
                        }`}
                      >
                        <input
                          type="file"
                          id="manuscript-file-input"
                          accept=".txt,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileChange(e.target.files[0]);
                            }
                          }}
                        />
                        <label
                          htmlFor="manuscript-file-input"
                          className="flex flex-col items-center justify-center cursor-pointer space-y-2.5 text-center px-4"
                        >
                          <span className="text-3xl animate-pulse">📥</span>
                          <span className="text-xs font-mono text-zinc-300">
                            {isDragging ? "Drop artifact now..." : "Drag & Drop File here"}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            or <span className="text-horror-crimson underline hover:text-red-400 px-1 border border-zinc-900 rounded bg-black font-bold">browse local library</span>
                          </span>
                          <span className="text-[9px] font-mono text-zinc-600 tracking-wide mt-1">
                            Supported: PDF, DOC, DOCX, TXT (Max size 20 MB)
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded flex items-center justify-between relative overflow-hidden animate-fadeIn">
                        <div className="absolute top-0 left-0 w-1 h-full bg-horror-crimson" />
                        <div className="flex items-center space-x-3 pl-2">
                          <span className="text-2xl">📄</span>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-mono font-bold text-white max-w-[200px] sm:max-w-xs truncate">
                              {uploadedFile.name}
                            </h4>
                            <p className="text-[9px] font-mono text-zinc-500 flex items-center space-x-2">
                              <span>Size: {(uploadedFile.size / 1024).toFixed(1)} KB</span>
                              <span className="text-zinc-700">•</span>
                              <span className="uppercase text-horror-decay font-bold bg-horror-blood/15 px-1 rounded border border-horror-blood/10">
                                {uploadedFile.name.split('.').pop()}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            setStoryContent("");
                          }}
                          className="text-[10px] font-mono text-zinc-400 hover:text-horror-crimson border border-zinc-900 hover:border-horror-blood rounded px-2.5 py-1.5 transition-all bg-black/40 cursor-pointer"
                        >
                          [Delete]
                        </button>
                      </div>
                    )}

                    {fileError && (
                      <div className="bg-red-950/20 border border-horror-blood/40 px-3 py-2 rounded text-[10px] font-mono text-horror-crimson animate-pulse">
                        ⚠️ {fileError}
                      </div>
                    )}

                    {uploadedFile && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                            Preview
                          </span>
                          <span className="text-[9px] font-mono text-zinc-600">
                            Characters: {storyContent.length}
                          </span>
                        </div>
                        <textarea
                          readOnly
                          rows={4}
                          value={storyContent}
                          className="w-full bg-zinc-950/50 text-zinc-400 font-typewriter text-[11px] border border-zinc-900 focus:outline-none p-3 rounded"
                          id="story-content-textarea-preview"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Spooky checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={noAiChecked}
                    onChange={(e) => setNoAiChecked(e.target.checked)}
                    className="mt-0.5 border-zinc-800 accent-horror-blood checked:bg-horror-crimson"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 select-none">
                    I pledge this script is written by a <span className="text-horror-crimson font-bold">Human</span> and is free of Plagiarism and AI suggestions.
                  </span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 border-zinc-800 accent-horror-blood checked:bg-horror-crimson"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200 select-none">
                    I understand clicking Transmit submits my work to Forbidden Archives Team giving them  <span className="text-horror-crimson font-bold">all publishing rights</span>.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isTransmitting}
                  className="w-full relative py-3 bg-zinc-950 text-white font-mono text-xs uppercase tracking-widest font-black border border-horror-blood hover:border-horror-crimson rounded hover:bg-horror-blood/20 cursor-pointer overflow-hidden group transition-all"
                  id="transmission-submit-btn"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {isTransmitting ? (
                      <>
                        
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>SUBMIT</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dynamic Transmission Overlay */}
      <AnimatePresence>
        {isTransmitting && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 crt-screen">
            <div className="text-center space-y-4 max-w-md w-full">
              <span className="text-4xl block animate-bounce">⚡</span>
              <h4 className="font-display text-lg text-white uppercase tracking-widest animate-pulse-slow">
                Initiating Ritual
              </h4>
              
              <div className="text-left bg-zinc-950 border border-zinc-800 p-4 rounded font-mono text-[10px] text-green-500 h-28 overflow-y-auto space-y-1">
                <div>[SYSTEM] Initiating...</div>
                <div>[SYSTEM] Binding pen name : {penName}</div>
                <div>[SYSTEM] Packaging story characters: {storyContent.length}</div>
                <div>[SYSTEM] Aligning the planets</div>
                <div>[SYSTEM] Sending...</div>
              </div>

              <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.1, ease: "easeInOut" }}
                  className="bg-horror-crimson h-full"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
