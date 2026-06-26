import React, { useState, useEffect } from "react";
import { QuizQuestion } from "../types";
import { Award, HelpCircle, Check, X, ArrowLeft, RefreshCw, Sparkles, ChevronRight, MessageSquareQuote } from "lucide-react";

interface QuizViewProps {
  onUnlockBadge: (badgeId: string) => void;
  onIncrementQuestions: (correct: boolean) => void;
  onIncrementSessions: () => void;
  prefilledTopic?: string;
  prefilledMaterial?: string;
}

export default function QuizView({
  onUnlockBadge,
  onIncrementQuestions,
  onIncrementSessions,
  prefilledTopic = "",
  prefilledMaterial = "",
}: QuizViewProps) {
  const [topic, setTopic] = useState(prefilledTopic);
  const [material, setMaterial] = useState(prefilledMaterial);

  useEffect(() => {
    if (prefilledTopic) setTopic(prefilledTopic);
    if (prefilledMaterial) setMaterial(prefilledMaterial);
  }, [prefilledTopic, prefilledMaterial]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !material.trim()) {
      setError("Please specify a topic or supply reference materials.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, material, count: 5 }),
      });

      if (!response.ok) {
        throw new Error("Unable to create quiz. Check your connection or Secrets panel.");
      }

      const data = await response.json();
      if (data.quiz && data.quiz.length > 0) {
        setQuestions(data.quiz);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsSubmitted(false);
        setScore(0);
        setQuizCompleted(false);
        onUnlockBadge("scholar");
        onIncrementSessions();
      } else {
        throw new Error("No quiz questions generated. Try adjusting your input.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitted) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setIsSubmitted(true);
    onIncrementQuestions(isCorrect);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      // Perfect Score Badge trigger
      if (score + (selectedOption === questions[currentIndex].correctAnswer ? 1 : 0) === questions.length) {
        onUnlockBadge("brainiac");
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleStartNew = () => {
    setQuestions([]);
    setTopic("");
    setMaterial("");
    setQuizCompleted(false);
  };

  return (
    <div id="quiz-view-container" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[500px] flex flex-col justify-between">
      {/* 1. INITIAL FORM TO CREATE QUIZ */}
      {questions.length === 0 && (
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">AI Smart Quiz Generator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Generate customizable, highly relevant multiple-choice practice tests on any topic. Our AI generates unique conceptual questions with immediate feedback and detailed reasoning to ensure you grasp the logic.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="quiz-topic-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic / Exam Name
                </label>
                <input
                  type="text"
                  id="quiz-topic-input"
                  placeholder="e.g. Mitochondria & Cellular Respiration"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="quiz-material-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Study Context / Notes (Optional)
                </label>
                <textarea
                  id="quiz-material-input"
                  placeholder="Paste lecture outlines, definitions, or slide notes to ground the questions..."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-sans resize-none"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div id="quiz-error" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>

          <button
            type="button"
            id="btn-generate-quiz"
            onClick={handleGenerate}
            disabled={isLoading || (!topic.trim() && !material.trim())}
            className={`w-full py-2.5 mt-6 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              isLoading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Formulating Practice Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Smart Quiz</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. ACTIVE QUIZ PLAYBACK */}
      {questions.length > 0 && !quizCompleted && (
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            {/* Header Trackers */}
            <div className="flex items-center justify-between mb-5">
              <button
                id="btn-quiz-back-new"
                onClick={handleStartNew}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                New Quiz
              </button>
              <div className="text-xs font-mono text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 transition-all duration-300"
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Label */}
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 mb-2 block">
                Practice Question
              </span>
              <h4 className="text-base font-bold text-slate-800 leading-snug font-display">
                {questions[currentIndex].question}
              </h4>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5">
              {questions[currentIndex].options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrectVal = option === questions[currentIndex].correctAnswer;
                const showCheckIcon = isSubmitted && isCorrectVal;
                const showCrossIcon = isSubmitted && isSelected && !isCorrectVal;

                let optionStyle = "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50";
                if (isSelected && !isSubmitted) {
                  optionStyle = "border-indigo-500 bg-indigo-50/20 text-indigo-900";
                } else if (isSubmitted) {
                  if (isCorrectVal) {
                    optionStyle = "border-emerald-500 bg-emerald-50/30 text-emerald-900 font-medium";
                  } else if (isSelected) {
                    optionStyle = "border-rose-300 bg-rose-50/20 text-rose-900";
                  } else {
                    optionStyle = "border-slate-100 bg-slate-50/50 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    id={`quiz-option-${idx}`}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                    disabled={isSubmitted}
                  >
                    <span>{option}</span>
                    {showCheckIcon && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {showCrossIcon && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {isSubmitted && (
              <div id="quiz-explanation-box" className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500" />
                  Educational Logic & Feedback
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {questions[currentIndex].explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            {!isSubmitted ? (
              <button
                type="button"
                id="btn-quiz-submit"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className={`px-6 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedOption
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Check Answer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-quiz-next"
                onClick={handleNext}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span>
                  {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. FINAL RESULTS SCREEN */}
      {quizCompleted && (
        <div className="flex-1 flex flex-col justify-between h-full text-center py-6">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Award className="w-8 h-8 text-indigo-600 animate-bounce" />
            </div>
            <h4 className="font-display font-bold text-slate-800 text-lg mb-2">
              Practice Session Completed!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              Terrific job completing this review. Practice testing is proven to boost active recall and long-term memory.
            </p>

            {/* Performance Stats */}
            <div className="inline-flex items-center gap-5 bg-slate-50 border border-slate-200/60 px-8 py-4 rounded-2xl mb-8">
              <div>
                <div className="text-3xl font-bold font-mono text-indigo-600">
                  {score} / {questions.length}
                </div>
                <div className="text-[10px] font-medium text-slate-500">Correct Answers</div>
              </div>
              <div className="h-10 w-[1px] bg-slate-200"></div>
              <div>
                <div className="text-3xl font-bold font-mono text-emerald-600">
                  {Math.round((score / questions.length) * 100)}%
                </div>
                <div className="text-[10px] font-medium text-slate-500">Total Score</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-w-sm mx-auto w-full">
            <button
              type="button"
              id="btn-restart-quiz"
              onClick={handleRestart}
              className="py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 text-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
            <button
              type="button"
              id="btn-new-quiz"
              onClick={handleStartNew}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>New Quiz Set</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
