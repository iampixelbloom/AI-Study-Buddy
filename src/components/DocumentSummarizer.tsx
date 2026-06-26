import React, { useState, useRef } from "react";
import { SummaryData } from "../types";
import { UploadCloud, FileText, Sparkles, RefreshCw, X, ArrowRight, Lightbulb, Check, HelpCircle } from "lucide-react";

interface DocumentSummarizerProps {
  onUnlockBadge: (badgeId: string) => void;
  onIncrementSessions: () => void;
  onSendToFlashcards: (topic: string, material: string) => void;
  onSendToQuizzes: (topic: string, material: string) => void;
}

const NEURO_SAMPLE = `The somatosensory cortex is located in the postcentral gyrus of the parietal lobe. It is organized somatotopically, meaning specific parts of the cortex correspond to specific parts of the body.

The Primary Somatosensory Cortex (S1) is responsible for processing direct sensory inputs like touch, temperature, and pain from the body receptors. It maps bodily locations on a physical representation called the sensory homunculus, which exaggerates sensitive parts like hands, lips, and tongue due to dense receptor distribution.

The cortex exhibits high plasticity, the capability to reorganize its sensory maps based on learning, repeated experience, or compensation after structural nerve injuries.`;

export default function DocumentSummarizer({
  onUnlockBadge,
  onIncrementSessions,
  onSendToFlashcards,
  onSendToQuizzes,
}: DocumentSummarizerProps) {
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to load a CDN script dynamically
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (err) => reject(new Error(`Failed to load script ${src}`));
      document.head.appendChild(script);
    });
  };

  // Parse files like .pdf, .docx, .pptx, .txt, .md, .csv
  const processFile = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsParsing(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    try {
      if (ext === "pdf") {
        // 1. Dynamic PDF Parsing via PDF.js CDN
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let textResult = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const strings = textContent.items.map((item: any) => item.str);
          textResult += strings.join(" ") + "\n";
        }

        if (!textResult.trim()) {
          throw new Error("This PDF appears to be empty or contains scanned images only.");
        }
        setInputText(textResult);

      } else if (ext === "docx") {
        // 2. Dynamic DOCX Parsing via Mammoth CDN
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
        const mammoth = (window as any).mammoth;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (!result.value.trim()) {
          throw new Error("This Word document appears to be empty.");
        }
        setInputText(result.value);

      } else if (ext === "pptx") {
        // 3. Dynamic PPTX Parsing via JSZip CDN
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
        const JSZip = (window as any).JSZip;
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        let textResult = "";

        const slideFiles = Object.keys(zip.files).filter(
          (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
        );

        if (slideFiles.length === 0) {
          throw new Error("No PowerPoint slides found in this file.");
        }

        // Sort slideFiles numerically so slides are processed in order
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
          const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
          return numA - numB;
        });

        for (let idx = 0; idx < slideFiles.length; idx++) {
          const fileKey = slideFiles[idx];
          const content = await zip.files[fileKey].async("text");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          const slideText = xmlDoc.documentElement.textContent || "";
          
          if (slideText.trim()) {
            textResult += `\n--- Slide ${idx + 1} ---\n` + slideText.trim() + "\n";
          }
        }

        if (!textResult.trim()) {
          throw new Error("PowerPoint slides do not contain extractable text.");
        }
        setInputText(textResult);

      } else {
        // 4. Default: Read as plain text (txt, md, csv, json, logs, etc.)
        const textResult = await file.text();
        setInputText(textResult);
      }
    } catch (err: any) {
      console.error("Document parsing error:", err);
      setError(err.message || "Failed to parse the uploaded document.");
      setFileName(null);
    } finally {
      setIsParsing(false);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setInputText("");
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadSample = () => {
    setInputText(NEURO_SAMPLE);
    setFileName("somatosensory_cortex_notes.txt");
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError("Please paste some text notes or upload a document first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputText,
          fileName: fileName || "Pasted Notes",
        }),
      });

      if (!response.ok) {
        throw new Error("Could not process document. Ensure Gemini is available.");
      }

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
        onUnlockBadge("scholar");
        onIncrementSessions();
      } else {
        throw new Error("Invalid response format received from summarization endpoint.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during summarization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="summarizer-container" className="space-y-6">
      {/* 1. DOCUMENT INPUT & UPLOAD SECTION */}
      {!summary ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <UploadCloud className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">AI Document Summarizer</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Upload textbook notes, syllabus PDFs, Word documents, or lecture slides. Our AI will synthesize key concepts, build core outlines, and prepare dynamic analysis insights for your study journey.
            </p>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 mb-4 ${
                isDragging
                  ? "border-indigo-600 bg-indigo-50/25"
                  : fileName
                  ? "border-emerald-200 bg-emerald-50/10"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.pptx,.txt,.md,.json,.csv"
                className="hidden"
              />
              
              {isParsing ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs font-semibold text-slate-700">Parsing and extracting text...</span>
                  <span className="text-[10px] text-slate-400">Reading layout, lines, and slide structures</span>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">{fileName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="text-[10px] text-rose-500 hover:underline font-semibold"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-slate-50 text-slate-400 rounded-full">
                    <UploadCloud className="w-6 h-6 text-indigo-500" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">
                    Drag & drop files here, or <span className="text-indigo-600 font-bold">browse</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Supports PDF, DOCX, PPTX, TXT, MD, CSV</span>
                </div>
              )}
            </div>

            {/* Plain Text input area */}
            <div className="relative">
              <label htmlFor="text-paste-area" className="block text-xs font-semibold text-slate-700 mb-1">
                Or paste study content directly
              </label>
              <textarea
                id="text-paste-area"
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste paragraph explanations, terminology, lecture slides, or copy-paste books here..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-sans resize-none"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-8 p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Demo Sample Action */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={loadSample}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50"
              >
                💡 Load Neuroscience Sample Notes
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSummarize}
            disabled={isLoading || !inputText.trim()}
            className={`w-full py-2.5 mt-6 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              isLoading || !inputText.trim()
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Key Syllabus...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize & Extract Concepts</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* 2. SUMMARIZED OUTLINE OUTPUT (Matching Professional Polish spec) */
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/50">
              <div className="flex gap-4">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  AI Synced Document Summary
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Summarize Another Document</span>
              </button>
            </div>

            <div className="p-8">
              {/* Scholarly Title in Serif/Italic Style */}
              <h2 className="text-2xl font-serif text-slate-800 mb-4 italic font-bold">
                {summary.title}
              </h2>

              {/* Overview paragraph */}
              <p className="text-slate-600 leading-relaxed text-sm mb-6 pb-6 border-b border-slate-100">
                {summary.overview}
              </p>

              {/* Concepts List */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Key Course Concepts
                </h3>
                
                {summary.keyConcepts.map((concept, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                      {concept.conceptName}
                    </h4>
                    <p className="text-xs text-slate-500 italic pl-3.5">
                      {concept.description}
                    </p>
                    <ul className="list-disc ml-8 space-y-1.5 text-xs text-slate-600">
                      {concept.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx}>
                          {bullet.includes(":") ? (
                            <>
                              <strong>{bullet.split(":")[0]}:</strong>
                              {bullet.split(":").slice(1).join(":")}
                            </>
                          ) : (
                            bullet
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Custom AI analysis box (matching Professional Polish styling exactly) */}
              <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-500 italic uppercase mb-2 tracking-wider font-bold">
                  AI Analysis Insight
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {summary.aiInsight}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Shortcuts to feed content into other tabs */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Interactive Recall Workflows
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Send this extracted course outline directly into other workspace modules to generate interactive materials instantly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => onSendToFlashcards(summary.title, summary.overview + "\n" + JSON.stringify(summary.keyConcepts))}
                className="p-4 rounded-xl border border-emerald-100 hover:border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50 text-left transition-all duration-200 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 block">
                  Create Flashcards
                </span>
                <span className="text-xs font-semibold text-slate-800 block mb-1">
                  Flashcard Recall Set
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                  Build cards on {summary.title}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-emerald-600" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSendToQuizzes(summary.title, summary.overview + "\n" + JSON.stringify(summary.keyConcepts))}
                className="p-4 rounded-xl border border-indigo-100 hover:border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 text-left transition-all duration-200 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block">
                  Formulate Quiz
                </span>
                <span className="text-xs font-semibold text-slate-800 block mb-1">
                  Syllabus Practice Exam
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                  Generate 5 questions automatically
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-indigo-600" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
