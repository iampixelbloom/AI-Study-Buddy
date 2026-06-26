import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, HelpCircle, Flame, ArrowRight, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";

interface AIChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string, mode: "standard" | "simplify" | "analogy" | "test") => Promise<void>;
  isLoading: boolean;
  onUnlockBadge: (badgeId: string) => void;
  isFullWorkspace?: boolean;
}

const QUICK_STARTERS = [
  {
    label: "Explain Simply",
    text: "Explain how quantum computing works in a simple way.",
    mode: "simplify" as const,
  },
  {
    label: "Give Analogy",
    text: "Give me a creative analogy for how APIs transfer data.",
    mode: "analogy" as const,
  },
  {
    label: "Test Me",
    text: "Test my knowledge on photosynthesis with a quick question.",
    mode: "test" as const,
  },
];

export default function AIChat({ chatHistory, onSendMessage, isLoading, onUnlockBadge, isFullWorkspace }: AIChatProps) {
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<"standard" | "simplify" | "analogy" | "test">("standard");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput("");
    onUnlockBadge("curious_mind");
    await onSendMessage(messageText, selectedMode);
  };

  const handleStarterClick = async (starter: typeof QUICK_STARTERS[number]) => {
    if (isLoading) return;
    setSelectedMode(starter.mode);
    onUnlockBadge("curious_mind");
    await onSendMessage(starter.text, starter.mode);
  };

  // Custom simple Markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-2 mb-1 font-display">{parseInlineStyles(line.slice(4))}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-slate-800 mt-3 mb-1.5 font-display">{parseInlineStyles(line.slice(3))}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-bold text-slate-800 mt-4 mb-2 font-display">{parseInlineStyles(line.slice(2))}</h2>;
      }

      // Bullet Lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const cleanLine = line.trim().substring(2);
        return (
          <ul key={idx} className="list-disc pl-5 my-0.5 text-slate-700 text-sm">
            <li>{parseInlineStyles(cleanLine)}</li>
          </ul>
        );
      }

      // Numbered Lists
      const numMatch = line.trim().match(/^\d+\.\s(.*)/);
      if (numMatch) {
        return (
          <ol key={idx} className="list-decimal pl-5 my-0.5 text-slate-700 text-sm">
            <li>{parseInlineStyles(numMatch[1])}</li>
          </ol>
        );
      }

      // Empty Lines
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5"></div>;
      }

      return <p key={idx} className="text-slate-700 leading-relaxed text-sm mb-1">{parseInlineStyles(line)}</p>;
    });
  };

  const parseInlineStyles = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentText = text;

    while (currentText.length > 0) {
      const boldStart = currentText.indexOf("**");
      const codeStart = currentText.indexOf("`");

      if (boldStart === -1 && codeStart === -1) {
        parts.push(currentText);
        break;
      }

      if (boldStart !== -1 && (codeStart === -1 || boldStart < codeStart)) {
        if (boldStart > 0) {
          parts.push(currentText.substring(0, boldStart));
        }
        const boldEnd = currentText.indexOf("**", boldStart + 2);
        if (boldEnd !== -1) {
          parts.push(
            <strong key={boldStart + Math.random()} className="font-semibold text-slate-900">
              {currentText.substring(boldStart + 2, boldEnd)}
            </strong>
          );
          currentText = currentText.substring(boldEnd + 2);
        } else {
          parts.push(currentText.substring(boldStart));
          break;
        }
      } else {
        if (codeStart > 0) {
          parts.push(currentText.substring(0, codeStart));
        }
        const codeEnd = currentText.indexOf("`", codeStart + 1);
        if (codeEnd !== -1) {
          parts.push(
            <code key={codeStart + Math.random()} className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded font-mono text-xs">
              {currentText.substring(codeStart + 1, codeEnd)}
            </code>
          );
          currentText = currentText.substring(codeEnd + 1);
        } else {
          parts.push(currentText.substring(codeStart));
          break;
        }
      }
    }

    return <>{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</>;
  };

  return (
    <div id="ai-chat-container" className={`bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden ${isFullWorkspace ? "flex-1 h-full min-h-[550px]" : "h-[580px]"}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-50/20 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-800">Chat with Study Buddy</h3>
            <p className="text-[11px] text-slate-500">Instant explanations, mental analogies, and micro tests</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div id="chat-messages-scroll" className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="p-4 bg-indigo-50 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
            <h4 className="font-display font-semibold text-slate-800 text-sm mb-1">What are we learning today?</h4>
            <p className="text-slate-500 text-xs max-w-xs mb-6">
              Ask any educational question, paste in textbook concepts, or use one of our quick starters below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {QUICK_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  id={`starter-${i}`}
                  onClick={() => handleStarterClick(starter)}
                  disabled={isLoading}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 hover:text-indigo-600 text-left transition-all duration-200 group flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500/80 mb-2">
                    {starter.label}
                  </span>
                  <span className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                    "{starter.text}"
                  </span>
                  <span className="self-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                id={`msg-${message.id}`}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`px-4 py-3.5 rounded-2xl text-slate-800 ${
                    isUser
                      ? "bg-slate-800 text-white rounded-br-xs text-sm"
                      : "bg-slate-50 rounded-bl-xs border border-slate-100"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(message.text)}</div>
                  )}
                  <span className={`text-[9px] mt-1.5 block text-right font-mono ${isUser ? "text-slate-400" : "text-slate-400"}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div id="chat-loading-bubble" className="flex gap-3 max-w-[80%] mr-auto">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-bl-xs border border-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Study Buddy is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mode Selectors */}
      <div className="px-6 py-2 border-t border-slate-50 bg-slate-50/50 flex gap-1.5 overflow-x-auto">
        <button
          type="button"
          id="mode-btn-standard"
          onClick={() => setSelectedMode("standard")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedMode === "standard"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100"
          }`}
        >
          🎓 Standard Explain
        </button>
        <button
          type="button"
          id="mode-btn-simplify"
          onClick={() => setSelectedMode("simplify")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedMode === "simplify"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100"
          }`}
        >
          👶 Simplify (ELI5)
        </button>
        <button
          type="button"
          id="mode-btn-analogy"
          onClick={() => setSelectedMode("analogy")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedMode === "analogy"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100"
          }`}
        >
          🧩 Fun Analogy
        </button>
        <button
          type="button"
          id="mode-btn-test"
          onClick={() => setSelectedMode("test")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedMode === "test"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100"
          }`}
        >
          ⚡ Interactive Test
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
        <input
          type="text"
          id="chat-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedMode === "simplify"
              ? "What concept should I simplify for you?..."
              : selectedMode === "analogy"
              ? "Ask for an analogy (e.g. 'How databases work')..."
              : selectedMode === "test"
              ? "Ask me to test you on a topic (e.g. 'photosynthesis')..."
              : "Type your study question here..."
          }
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          id="chat-send-button"
          disabled={!input.trim() || isLoading}
          className={`p-3 rounded-xl transition-all ${
            input.trim() && !isLoading
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
