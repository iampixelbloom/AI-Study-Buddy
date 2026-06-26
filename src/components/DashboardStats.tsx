import React, { useState, useEffect } from "react";
import { StudyStats, Badge } from "../types";
import { Award, BookOpen, Flame, HelpCircle, CheckCircle2, ShieldCheck, Sparkles, Plus, Check, Trash2, Edit3, ClipboardList, GraduationCap, ArrowRight } from "lucide-react";

interface DashboardStatsProps {
  stats: StudyStats;
  onSelectPreset: (topic: string, material: string, tab: "summarizer" | "flashcards" | "quizzes") => void;
}

const ALL_BADGES: Badge[] = [
  {
    id: "curious_mind",
    title: "Curious Mind",
    description: "Initiated your first deep-dive chat with AI Study Buddy.",
    icon: "HelpCircle",
  },
  {
    id: "scholar",
    title: "Scholar Set Creator",
    description: "Generated custom AI flashcards or quizzes for a topic.",
    icon: "BookOpen",
  },
  {
    id: "brainiac",
    title: "Perfect Score",
    description: "Answered every question correctly on any practice quiz.",
    icon: "Award",
  },
  {
    id: "streak_master",
    title: "Habit Builder",
    description: "Maintained a daily studying streak.",
    icon: "Flame",
  },
  {
    id: "tenacious",
    title: "Tenacious Learner",
    description: "Answered 5 or more quiz questions in total.",
    icon: "ShieldCheck",
  },
];

const PRESETS = [
  {
    topic: "Human Neurobiology",
    category: "Science",
    tagline: "Brain lobes, somatosensory cortex, and neural plasticity.",
    material: "The Primary Somatosensory Cortex (S1) is located in the postcentral gyrus of the parietal lobe. It processes somatic sensory inputs like touch, temperature, and pain. It features a somatotopic organization represented by the sensory homunculus, exaggerating highly sensitive regions like the hands and tongue. Neural plasticity allows these sensory maps to reorganize dynamically based on training or injury compensation.",
  },
  {
    topic: "Web Development APIs",
    category: "Technology",
    tagline: "HTTP requests, RESTful architectures, and JSON exchanges.",
    material: "Application Programming Interfaces (APIs) allow different software systems to communicate. REST (Representational State Transfer) is a common architecture using HTTP methods. GET retrieves resources, POST creates resources, PUT/PATCH updates, and DELETE removes them. Status codes indicate results (e.g., 200 OK, 404 Not Found, 500 Internal Error). Data is usually exchanged in JSON formats.",
  },
  {
    topic: "Ancient Civilizations",
    category: "History",
    tagline: "Mesopotamian societies, cuneiform, and the Code of Hammurabi.",
    material: "Mesopotamia, located between the Tigris and Euphrates rivers, is considered the cradle of civilization. The Sumerians developed cuneiform, one of the earliest writing systems. Later, the Babylonian king Hammurabi compiled one of the oldest legal codes (the Code of Hammurabi), which established standardized laws and punishments based on retributive justice ('an eye for an eye').",
  }
];

const INITIAL_TASKS = [
  { id: "1", text: "Upload a study document (PDF, Word, or PowerPoint) to summarize", completed: false },
  { id: "2", text: "Generate interactive active-recall Flashcards", completed: false },
  { id: "3", text: "Take a smart Quiz and test your memory limits", completed: false },
  { id: "4", text: "Ask the AI Study Buddy to explain a complex topic simply", completed: false },
];

export default function DashboardStats({ stats, onSelectPreset }: DashboardStatsProps) {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("study_buddy_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  
  const [newTaskText, setNewTaskText] = useState("");
  const [memo, setMemo] = useState(() => {
    return localStorage.getItem("study_buddy_memo") || "";
  });

  useEffect(() => {
    localStorage.setItem("study_buddy_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("study_buddy_memo", memo);
  }, [memo]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t: any) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t: any) => t.id !== id));
  };

  const iconMap: Record<string, React.ReactNode> = {
    HelpCircle: <HelpCircle className="w-5 h-5 text-indigo-500" />,
    BookOpen: <BookOpen className="w-5 h-5 text-emerald-500" />,
    Award: <Award className="w-5 h-5 text-amber-500" />,
    Flame: <Flame className="w-5 h-5 text-rose-500" />,
    ShieldCheck: <ShieldCheck className="w-5 h-5 text-violet-500" />,
  };

  const completedCount = tasks.filter((t: any) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div id="dashboard-stats" className="space-y-6">
      
      {/* 1. TOP DOCK: Daily Objectives & Quick Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Study Objectives */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-slate-800 text-sm">My Study Objectives</h3>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                {completedCount}/{tasks.length} Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Tasks list */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    task.completed 
                      ? "bg-slate-50/50 border-slate-100 text-slate-400" 
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      task.completed 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "border-slate-300 bg-white"
                    }`}>
                      {task.completed && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs font-medium transition-all ${task.completed ? "line-through" : ""}`}>
                      {task.text}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Task Form */}
          <form onSubmit={addTask} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add custom study task..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick Session Scratchpad */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">Study Scratchpad</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Jot down quick reminders, topics to research, or concepts you want the AI Study Buddy to test you on.
            </p>
          </div>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Type your study notes here..."
            className="w-full flex-1 min-h-[140px] px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-sans resize-none"
          />
        </div>

      </div>

      {/* 2. SYLLABUS QUICK PRESETS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Instant Syllabus Launchpad</h3>
            <p className="text-[11px] text-slate-400">Click any preset topic below to immediately populate study material into your workspace modules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((preset, index) => (
            <div key={index} className="border border-slate-150 hover:border-indigo-200 rounded-xl p-4.5 bg-slate-50/30 hover:bg-white transition-all flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {preset.category}
                </span>
                <h4 className="font-display font-bold text-slate-800 text-xs mt-2.5 mb-1">{preset.topic}</h4>
                <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{preset.tagline}</p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset.topic, preset.material, "summarizer")}
                  className="flex-1 py-1.5 bg-slate-150 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Outline
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset.topic, preset.material, "flashcards")}
                  className="flex-1 py-1.5 bg-slate-150 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset.topic, preset.material, "quizzes")}
                  className="flex-1 py-1.5 bg-slate-150 hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ACHIEVEMENTS & BADGES (From current Turn but rendered neatly) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Unlocked Achievements & Badges</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
            {stats.unlockedBadges.length} / {ALL_BADGES.length}
          </span>
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = stats.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                id={`badge-${badge.id}`}
                className={`relative p-3.5 rounded-xl border transition-all duration-300 flex flex-col items-center text-center ${
                  isUnlocked
                    ? "bg-slate-50/70 border-slate-100 shadow-xs scale-100"
                    : "bg-slate-100/30 border-slate-100/50 opacity-40 grayscale"
                }`}
              >
                <div className={`p-2.5 rounded-xl mb-2.5 ${isUnlocked ? "bg-white shadow-xs" : "bg-slate-100"}`}>
                  {iconMap[badge.icon] || <Award className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">{badge.title}</div>
                <div className="text-[10px] text-slate-500 leading-tight line-clamp-2 md:line-clamp-none">
                  {badge.description}
                </div>
                {isUnlocked && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
