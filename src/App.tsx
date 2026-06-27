import React, { useState, useEffect } from "react";
import { StudyStats, ChatMessage } from "./types";
import DashboardStats from "./components/DashboardStats";
import DocumentSummarizer from "./components/DocumentSummarizer";
import FlashcardDeck from "./components/FlashcardDeck";
import QuizView from "./components/QuizView";
import AIChat from "./components/AIChat";
import { Award, BookOpen, GraduationCap, Clock, FileText, LayoutDashboard, MessageSquare, HelpCircle as HelpIcon } from "lucide-react";

const LOCAL_STORAGE_KEY = "ai_study_buddy_stats";

const INITIAL_STATS: StudyStats = {
  sessionsCount: 3,
  questionsAnswered: 4,
  correctAnswersCount: 3,
  streak: 2,
  unlockedBadges: ["streak_master"],
  lastStudyDate: new Date().toISOString().split("T")[0],
};

export default function App() {
  const [stats, setStats] = useState<StudyStats>(INITIAL_STATS);
  const [activeTab, setActiveTab] = useState<"stats" | "chat" | "summarizer" | "flashcards" | "quizzes">("stats");
  const [prefilledTopic, setPrefilledTopic] = useState("");
  const [prefilledMaterial, setPrefilledMaterial] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0); // in seconds

  // Initialize and load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(parsed);
      } catch (e) {
        console.error("Failed to parse saved stats:", e);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STATS));
    }
  }, []);

  // Update localStorage whenever stats change
  const saveStats = (newStats: StudyStats) => {
    setStats(newStats);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStats));
  };

  // Keep a ticking session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format ticking session time to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Logic to handle answering a question
  const handleIncrementQuestions = (correct: boolean) => {
    const nextAnswered = stats.questionsAnswered + 1;
    const nextCorrect = correct ? stats.correctAnswersCount + 1 : stats.correctAnswersCount;
    const updatedBadges = [...stats.unlockedBadges];

    if (nextAnswered >= 5 && !updatedBadges.includes("tenacious")) {
      updatedBadges.push("tenacious");
    }

    saveStats({
      ...stats,
      questionsAnswered: nextAnswered,
      correctAnswersCount: nextCorrect,
      unlockedBadges: updatedBadges,
    });
  };

  // Logic to handle a completed study session (deck creation or quiz formulation)
  const handleIncrementSessions = () => {
    const nextSessions = stats.sessionsCount + 1;
    const todayStr = new Date().toISOString().split("T")[0];
    let nextStreak = stats.streak;

    if (stats.lastStudyDate && stats.lastStudyDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (stats.lastStudyDate === yesterdayStr) {
        nextStreak += 1;
      } else {
        nextStreak = 1;
      }
    }

    const updatedBadges = [...stats.unlockedBadges];
    if (nextStreak >= 3 && !updatedBadges.includes("streak_master")) {
      updatedBadges.push("streak_master");
    }

    saveStats({
      ...stats,
      sessionsCount: nextSessions,
      streak: nextStreak,
      lastStudyDate: todayStr,
      unlockedBadges: updatedBadges,
    });
  };

  // Logic to unlock badges instantly
  const handleUnlockBadge = (badgeId: string) => {
    if (!stats.unlockedBadges.includes(badgeId)) {
      const updatedBadges = [...stats.unlockedBadges, badgeId];
      saveStats({
        ...stats,
        unlockedBadges: updatedBadges,
      });
    }
  };

  // Send a message to the AI Chat API
  const handleSendChatMessage = async (
    message: string,
    mode: "standard" | "simplify" | "analogy" | "test"
  ) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      text: message,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          mode,
          history: chatHistory.map((h) => ({
            role: h.role === "user" ? "user" : "model",
            text: h.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Chat service is briefly offline. Verify your API Key.");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "model",
        text: data.text || "I was unable to formulate an answer. Let's try another approach!",
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "model",
        text: `⚠️ **Service Error**: ${error.message || "An unexpected error occurred. Please verify your connection."}`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetSession = () => {
    setSessionTime(0);
  };

  const handleSendToFlashcards = (topic: string, material: string) => {
    setPrefilledTopic(topic);
    setPrefilledMaterial(material);
    setActiveTab("flashcards");
  };

  const handleSendToQuizzes = (topic: string, material: string) => {
    setPrefilledTopic(topic);
    setPrefilledMaterial(material);
    setActiveTab("quizzes");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900">
      {/* LEFT NAVIGATION RAIL (Identical styling to Professional Polish spec) */}
      <nav id="sidebar-nav-rail" className="w-20 bg-indigo-950 flex flex-col items-center py-8 gap-8 border-r border-indigo-900 shrink-0">
        {/* Brand Logo */}
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-indigo-600/30">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>

        {/* Tab Controllers */}
        <div className="flex flex-col gap-5 flex-1">
          <button
            type="button"
            id="btn-nav-stats"
            onClick={() => setActiveTab("stats")}
            title="Dashboard & Objectives"
            className={`p-3.5 rounded-xl transition-all duration-300 relative group ${
              activeTab === "stats"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Dashboard
            </span>
          </button>

          <button
            type="button"
            id="btn-nav-chat"
            onClick={() => setActiveTab("chat")}
            title="Chat with Study Buddy"
            className={`p-3.5 rounded-xl transition-all duration-300 relative group ${
              activeTab === "chat"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
            }`}
          >
            <MessageSquare className="w-5.5 h-5.5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Chat with Study Buddy
            </span>
          </button>

          <button
            type="button"
            id="btn-nav-summarizer"
            onClick={() => setActiveTab("summarizer")}
            title="Document Summarizer & Notes Synthesizer"
            className={`p-3.5 rounded-xl transition-all duration-300 relative group ${
              activeTab === "summarizer"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
            }`}
          >
            <FileText className="w-5.5 h-5.5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Document Summarizer
            </span>
          </button>

          <button
            type="button"
            id="btn-nav-flashcards"
            onClick={() => setActiveTab("flashcards")}
            title="Active recall Flashcards"
            className={`p-3.5 rounded-xl transition-all duration-300 relative group ${
              activeTab === "flashcards"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
            }`}
          >
            <BookOpen className="w-5.5 h-5.5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              AI Flashcards
            </span>
          </button>

          <button
            type="button"
            id="btn-nav-quizzes"
            onClick={() => setActiveTab("quizzes")}
            title="Practice Quizzes"
            className={`p-3.5 rounded-xl transition-all duration-300 relative group ${
              activeTab === "quizzes"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "text-indigo-300 hover:text-white hover:bg-indigo-900/40"
            }`}
          >
            <Award className="w-5.5 h-5.5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Smart Quizzes
            </span>
          </button>
        </div>


      </nav>

      {/* MAIN WORKSPACE WRAPPER */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header id="workspace-header" className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-display flex items-center gap-2">
              AI Study Buddy
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {activeTab === "stats" && "Personal Learning Dashboard & Daily Objectives"}
              {activeTab === "chat" && "Interactive Study Buddy Assistant"}
              {activeTab === "summarizer" && "AI Document Summarizer & Course Outliner"}
              {activeTab === "flashcards" && "AI Active Recall Flashcard Generator"}
              {activeTab === "quizzes" && "Adaptive Self-Testing Practice Exam"}
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Real Ticking Session Timer */}
            <div id="session-timer-badge" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold font-mono">Session: {formatTime(sessionTime)}</span>
            </div>

            <button
              type="button"
              id="btn-end-session"
              onClick={handleResetSession}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
            >
              Reset Timer
            </button>
          </div>
        </header>

        {/* WORKSPACE & CHAT BODY PANE */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Active Workspace Feature Panel */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            {activeTab === "stats" && (
              <DashboardStats 
                stats={stats} 
                onSelectPreset={(topic, material, tab) => {
                  setPrefilledTopic(topic);
                  setPrefilledMaterial(material);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "chat" && (
              <AIChat
                chatHistory={chatHistory}
                onSendMessage={handleSendChatMessage}
                isLoading={chatLoading}
                onUnlockBadge={handleUnlockBadge}
                isFullWorkspace={true}
              />
            )}

            {activeTab === "summarizer" && (
              <DocumentSummarizer
                onUnlockBadge={handleUnlockBadge}
                onIncrementSessions={handleIncrementSessions}
                onSendToFlashcards={handleSendToFlashcards}
                onSendToQuizzes={handleSendToQuizzes}
              />
            )}

            {activeTab === "flashcards" && (
              <FlashcardDeck
                onUnlockBadge={handleUnlockBadge}
                onIncrementSessions={handleIncrementSessions}
                prefilledTopic={prefilledTopic}
                prefilledMaterial={prefilledMaterial}
              />
            )}

            {activeTab === "quizzes" && (
              <QuizView
                onUnlockBadge={handleUnlockBadge}
                onIncrementQuestions={handleIncrementQuestions}
                onIncrementSessions={handleIncrementSessions}
                prefilledTopic={prefilledTopic}
                prefilledMaterial={prefilledMaterial}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
