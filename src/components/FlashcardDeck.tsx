import React, { useState, useEffect } from "react";
import { Flashcard } from "../types";
import { BookOpen, HelpCircle, RotateCw, ArrowLeft, ArrowRight, RefreshCcw, Sparkles, Check, X, BookmarkCheck } from "lucide-react";

interface FlashcardDeckProps {
  onUnlockBadge: (badgeId: string) => void;
  onIncrementSessions: () => void;
  prefilledTopic?: string;
  prefilledMaterial?: string;
}

export default function FlashcardDeck({
  onUnlockBadge,
  onIncrementSessions,
  prefilledTopic = "",
  prefilledMaterial = "",
}: FlashcardDeckProps) {
  const [topic, setTopic] = useState(prefilledTopic);
  const [material, setMaterial] = useState(prefilledMaterial);

  useEffect(() => {
    if (prefilledTopic) setTopic(prefilledTopic);
    if (prefilledMaterial) setMaterial(prefilledMaterial);
  }, [prefilledTopic, prefilledMaterial]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [knownList, setKnownList] = useState<boolean[]>([]); // tracking correct/wrong
  const [studyCompleted, setStudyCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !material.trim()) {
      setError("Please provide at least a topic or some study material.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, material }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cards. Please check your network and API key settings.");
      }

      const data = await response.json();
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnownList(new Array(data.cards.length).fill(false));
        setStudyCompleted(false);
        onUnlockBadge("scholar");
        onIncrementSessions();
      } else {
        throw new Error("No flashcards could be generated. Try adjusting your query.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardDecision = (known: boolean) => {
    const nextKnown = [...knownList];
    nextKnown[currentIndex] = known;
    setKnownList(nextKnown);

    setIsFlipped(false);

    // Timeout to let flip animation reset before moving to next card
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setStudyCompleted(true);
      }
    }, 150);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownList(new Array(cards.length).fill(false));
    setStudyCompleted(false);
  };

  const handleStartNew = () => {
    setCards([]);
    setTopic("");
    setMaterial("");
    setStudyCompleted(false);
  };

  const masteredCount = knownList.filter((k) => k).length;

  return (
    <div id="flashcard-deck-container" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 min-h-[500px] flex flex-col justify-between">
      {/* 1. INITIAL FORM TO CREATE DECK */}
      {cards.length === 0 && (
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">AI Flashcard Generator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Input a subject, a course module, or paste text notes directly. Our AI will automatically synthesize the most important key concepts and terminology into a custom interactive deck of flashcards.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="card-topic-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic / Subject Name
                </label>
                <input
                  type="text"
                  id="card-topic-input"
                  placeholder="e.g. JavaScript Promises & Async/Await"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="card-material-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Materials (Optional)
                </label>
                <textarea
                  id="card-material-input"
                  placeholder="Paste textbook definitions, stack overflow answers, or lecture notes here..."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500 font-sans resize-none"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div id="card-error" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>

          <button
            type="button"
            id="btn-generate-cards"
            onClick={handleGenerate}
            disabled={isLoading || (!topic.trim() && !material.trim())}
            className={`w-full py-2.5 mt-6 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              isLoading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>Extracting Study Concepts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Smart Flashcards</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. ACTIVE FLASHCARD DECK STUDY SESSION */}
      {cards.length > 0 && !studyCompleted && (
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            {/* Header / Tracker */}
            <div className="flex items-center justify-between mb-5">
              <button
                id="btn-cards-back-new"
                onClick={handleStartNew}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                New Deck
              </button>
              <div className="text-xs font-mono text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                Card {currentIndex + 1} of {cards.length}
              </div>
            </div>

            {/* Interactive Flashcard with Perspective Flipping */}
            <div
              id="active-flashcard"
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-64 perspective-1000 cursor-pointer group"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d rounded-2xl ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 bg-white border border-slate-200 p-6 flex flex-col justify-between backface-hidden rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">
                      Flashcard Front
                    </span>
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-center py-4">
                    <p className="text-base font-semibold text-slate-800 leading-relaxed font-display">
                      {cards[currentIndex].front}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
                    <RotateCw className="w-3.5 h-3.5 animate-pulse" />
                    <span>Click to reveal answer</span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-emerald-50/100 border border-emerald-100 p-6 flex flex-col justify-between backface-hidden rotate-y-180 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600">
                      Answer Back
                    </span>
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="overflow-y-auto max-h-[140px] py-1">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {cards[currentIndex].back}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-medium">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click to view concept</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Controls: Self Assessment */}
          <div className="mt-8">
            <p className="text-center text-[11px] font-medium text-slate-500 mb-3.5">
              Did you correctly remember this concept?
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                id="btn-card-needs-practice"
                onClick={() => handleCardDecision(false)}
                className="py-2.5 rounded-xl border border-rose-100 hover:border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Needs Practice</span>
              </button>
              <button
                type="button"
                id="btn-card-got-it"
                onClick={() => handleCardDecision(true)}
                className="py-2.5 rounded-xl border border-emerald-100 hover:border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Got It!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETION SCREEN */}
      {studyCompleted && (
        <div className="flex-1 flex flex-col justify-between h-full text-center py-6">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <BookmarkCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-display font-bold text-slate-800 text-lg mb-2">
              Deck Completed!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              Terrific work! You completed the full revision of this cards deck. Here is your memory self-assessment score:
            </p>

            {/* Performance Metric */}
            <div className="inline-flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-3.5 rounded-2xl mb-8">
              <div>
                <div className="text-2xl font-bold font-mono text-emerald-600">
                  {masteredCount}
                </div>
                <div className="text-[10px] font-medium text-slate-500">Mastered</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div>
                <div className="text-2xl font-bold font-mono text-rose-500">
                  {cards.length - masteredCount}
                </div>
                <div className="text-[10px] font-medium text-slate-500">Review Next</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-w-sm mx-auto w-full">
            <button
              type="button"
              id="btn-restart-deck"
              onClick={handleReset}
              className="py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Study Again</span>
            </button>
            <button
              type="button"
              id="btn-new-deck"
              onClick={handleStartNew}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create New Set</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
