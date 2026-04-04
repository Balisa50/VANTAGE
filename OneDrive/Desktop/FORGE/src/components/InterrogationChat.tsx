"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { highlightCode } from "@/lib/interrogation";
import { formatTime } from "@/lib/utils";

interface MCQQuestion {
  questionNumber: number;
  type: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
}

type AnswerKey = "A" | "B" | "C" | "D";

interface AnswerResult {
  selected: AnswerKey;
  correct: boolean;
  explanation: string;
  correctAnswer: AnswerKey;
}

interface FinalScores {
  mastery: number;
  application: number;
  analysis: number;
  recall: number;
  depth: number;
  overall: number;
}

const TOTAL_QUESTIONS = 10;
const SECONDS_PER_QUESTION = 300; // 5 minutes

export default function InterrogationChat({
  interrogationId,
  checkinId,
  userName,
  onComplete,
}: {
  interrogationId: string;
  checkinId: string;
  userName: string;
  onComplete: () => void;
}) {
  const [question, setQuestion] = useState<MCQQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [questionNum, setQuestionNum] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [passed, setPassed] = useState(false);
  const [scores, setScores] = useState<FinalScores | null>(null);
  const [verdict, setVerdict] = useState("");
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(0);
  const [apiError, setApiError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmittedRef = useRef(false);

  // Anti-cheat: tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !answerResult && !isComplete) {
        setAntiCheatWarnings((w) => {
          const next = w + 1;
          if (next >= 2) {
            // Auto-fail
            handleAutoFail("tab_switch");
          }
          return next;
        });
      }
    };

    // Anti-cheat: paste detection
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      if (text.length > 20 && !answerResult && !isComplete) {
        handleAutoFail("copy_paste");
      }
    };

    // Anti-cheat: devtools (basic)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "F12") || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J"))) {
        e.preventDefault();
        if (!answerResult && !isComplete) handleAutoFail("devtools");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerResult, isComplete]);

  const handleAutoFail = async (reason: string) => {
    clearInterval(timerRef.current!);
    await fetch(`/api/interrogations/${interrogationId}/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setIsComplete(true);
    setPassed(false);
    setVerdict(`Interrogation auto-failed: ${reason.replace("_", " ")}. Integrity deducted.`);
  };

  const fetchQuestion = useCallback(async (num: number) => {
    setLoading(true);
    setAnswerResult(null);
    setTimeLeft(SECONDS_PER_QUESTION);
    autoSubmittedRef.current = false;
    setApiError(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`/api/interrogations/${interrogationId}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionNumber: num }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuestion(data.question);
      setLoading(false);
    } catch {
      setApiError(true);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interrogationId]);

  useEffect(() => {
    fetchQuestion(1);
  }, [fetchQuestion]);

  // Timer
  useEffect(() => {
    if (loading || answerResult || isComplete) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            submitAnswer("A"); // Auto-submit wrong answer on timeout
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, answerResult, isComplete, question]);

  const submitAnswer = async (selected: AnswerKey) => {
    if (submitting || answerResult) return;
    clearInterval(timerRef.current!);
    setSubmitting(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`/api/interrogations/${interrogationId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionNumber: questionNum,
          selected,
          timeSpent: SECONDS_PER_QUESTION - timeLeft,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      setSubmitting(false);

      if (data.correct) setCorrectCount((c) => c + 1);

      setAnswerResult({
        selected,
        correct: data.correct,
        explanation: data.explanation,
        correctAnswer: data.correctAnswer,
      });

      if (data.completed) {
        setIsComplete(true);
        setPassed(data.passed);
        setScores(data.scores);
        setVerdict(data.verdict);
      }
    } catch {
      setSubmitting(false);
      setApiError(true);
    }
  };

  const nextQuestion = () => {
    const next = questionNum + 1;
    setQuestionNum(next);
    fetchQuestion(next);
  };

  // Render code blocks in question text
  const renderQuestionText = (text: string) => {
    const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);
    return parts.map((part, i) => {
      const codeMatch = part.match(/```([\w]*)\n([\s\S]*?)```/);
      if (codeMatch) {
        const lang = codeMatch[1] || "javascript";
        const code = codeMatch[2];
        return (
          <div
            key={i}
            className="code-block"
            style={{ margin: "0.75rem 0" }}
            dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }}
          />
        );
      }
      return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
    });
  };

  // COMPLETED SCREEN
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="forge-panel"
        style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem", textAlign: "center" }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{passed ? "✅" : "❌"}</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: passed ? "var(--green)" : "var(--red)", marginBottom: "0.5rem" }}>
          {passed ? "INTERROGATION PASSED" : "INTERROGATION FAILED"}
        </h2>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {correctCount}/{TOTAL_QUESTIONS} correct
        </div>

        {verdict && (
          <div className="forge-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem", color: "var(--blue)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>THE PROFESSOR</div>
            <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.7 }}>{verdict}</p>
          </div>
        )}

        {scores && (
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[
              { label: "M", full: "Mastery", value: scores.mastery },
              { label: "A", full: "Application", value: scores.application },
              { label: "An", full: "Analysis", value: scores.analysis },
              { label: "R", full: "Recall", value: scores.recall },
              { label: "D", full: "Depth", value: scores.depth },
            ].map((s) => (
              <div key={s.label} className="forge-card" style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-dim)", marginBottom: "0.25rem" }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: s.value >= 7 ? "var(--green)" : s.value >= 5 ? "var(--yellow)" : "var(--red)" }}>
                  {s.value.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onComplete} className="forge-btn forge-btn-primary" style={{ width: "100%", marginTop: "1.5rem", padding: "0.875rem" }}>
          Back to Dashboard
        </button>
      </motion.div>
    );
  }

  // ANTI-CHEAT WARNING BANNER
  const warningBanner = antiCheatWarnings > 0 && (
    <div style={{ background: "rgba(255,45,45,0.15)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.625rem 1rem", marginBottom: "1rem", color: "var(--red)", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem" }}>
      ⚠️ WARNING {antiCheatWarnings}/2: Tab switch detected. One more = auto-fail.
    </div>
  );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Fixed header with timer */}
      <div
        className="forge-panel"
        style={{ position: "sticky", top: "0", zIndex: 10, padding: "1rem 1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--blue)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            THE PROFESSOR
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Q{questionNum}/{TOTAL_QUESTIONS} &nbsp;·&nbsp; {correctCount} correct
          </div>
        </div>

        {/* Timer */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", lineHeight: 1, color: timeLeft <= 60 ? "var(--red)" : timeLeft <= 120 ? "var(--yellow)" : "var(--green)" }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ width: "120px", height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "0.25rem" }}>
            <div
              className="timer-bar"
              style={{
                width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%`,
                background: timeLeft <= 60 ? "var(--red)" : timeLeft <= 120 ? "var(--yellow)" : "var(--green)",
              }}
            />
          </div>
        </div>
      </div>

      {warningBanner}

      {/* Question card */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="forge-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", color: "var(--blue)", fontSize: "0.875rem" }}>
              The Professor is preparing question {questionNum}...
            </div>
          </motion.div>
        ) : apiError ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="forge-panel" style={{ padding: "2rem", textAlign: "center" }}>
            <div style={{ color: "var(--red)", marginBottom: "1rem" }}>⚠️ Failed to load question. AI service may be down.</div>
            <button onClick={() => fetchQuestion(questionNum)} className="forge-btn forge-btn-ghost">Retry</button>
          </motion.div>
        ) : question ? (
          <motion.div key={`q-${questionNum}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="forge-panel" style={{ padding: "1.5rem 2rem", marginBottom: "1rem" }}>
              {/* Question type badge */}
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Q{questionNum} · {question.type.replace(/_/g, " ")}
              </div>

              {/* Question text */}
              <div style={{ fontSize: "1.0625rem", lineHeight: 1.7, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
                {renderQuestionText(question.question)}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {(["A", "B", "C", "D"] as AnswerKey[]).map((key) => {
                  let bg = "transparent";
                  let border = "var(--border)";
                  let color = "var(--text-primary)";

                  if (answerResult) {
                    if (key === answerResult.correctAnswer) {
                      bg = "rgba(0,255,136,0.1)"; border = "var(--green)"; color = "var(--green)";
                    } else if (key === answerResult.selected && !answerResult.correct) {
                      bg = "rgba(255,45,45,0.1)"; border = "var(--red)"; color = "var(--red)";
                    } else {
                      color = "var(--text-dim)";
                    }
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => !answerResult && !submitting && submitAnswer(key)}
                      disabled={!!answerResult || submitting}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1rem",
                        padding: "0.875rem 1.125rem",
                        borderRadius: "6px",
                        border: `1px solid ${border}`,
                        background: bg,
                        color,
                        cursor: answerResult ? "default" : "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!answerResult && !submitting) {
                          e.currentTarget.style.borderColor = "var(--blue)";
                          e.currentTarget.style.background = "rgba(0,200,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!answerResult) {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.875rem", fontWeight: 700, flexShrink: 0, minWidth: "1.5rem" }}>{key}.</span>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9375rem", lineHeight: 1.5 }}>{question.options[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation (after answer) */}
            {answerResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div
                  className="forge-card"
                  style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem", borderColor: answerResult.correct ? "var(--green)" : "var(--red)" }}
                >
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.75rem", color: answerResult.correct ? "var(--green)" : "var(--red)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                    {answerResult.correct ? "✓ CORRECT" : "✗ WRONG"} — THE PROFESSOR
                  </div>
                  <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.7 }}>
                    {answerResult.explanation}
                  </p>
                </div>

                {questionNum < TOTAL_QUESTIONS ? (
                  <button onClick={nextQuestion} className="forge-btn forge-btn-blue" style={{ width: "100%", padding: "0.875rem" }}>
                    Next Question ({questionNum + 1}/{TOTAL_QUESTIONS}) →
                  </button>
                ) : (
                  <div style={{ textAlign: "center", fontFamily: "'Share Tech Mono', monospace", color: "var(--text-secondary)", fontSize: "0.875rem", padding: "1rem" }}>
                    Computing verdict...
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
