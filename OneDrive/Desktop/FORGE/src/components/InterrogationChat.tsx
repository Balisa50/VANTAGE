"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { highlightCode } from "@/lib/interrogation";
import { formatTime } from "@/lib/utils";
import { AlertTriangle, Check, X, HelpCircle, Loader2, Share2, Copy, CheckCheck } from "lucide-react";

interface OpenQuestion {
  questionNumber: number;
  type: string;
  question: string;
  topic: string;
}

interface AnswerResult {
  score: number;
  feedback: string;
  hitKeypoints: string[];
  missedKeypoints: string[];
}

const TOTAL_QUESTIONS = 3;
const MAX_POINTS = 10;
const PASS_THRESHOLD = 12;
const SECONDS_PER_QUESTION = 420; // 7 minutes
const MIN_ANSWER_LEN = 30;
const RING_RADIUS = 38;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Circular SVG countdown ring */
function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = timeLeft / total;
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  const color = timeLeft <= 60 ? "#ef4444" : timeLeft <= 120 ? "#eab308" : "#22c55e";
  const size = 96;
  const cx = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="4" />
        {/* Progress */}
        <circle
          cx={cx} cy={cx} r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-headline)", fontSize: "1.375rem", lineHeight: 1,
          color: timeLeft <= 60 ? "var(--red)" : "var(--text-primary)",
        }}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}

/** Counts up a number for dramatic effect */
function AnimatedScore({ target, max }: { target: number; max: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame++;
      const progress = frame / total;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (frame >= total) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);

  const pct = max > 0 ? display / max : 0;
  const ringColor = pct >= 0.4 ? "#22c55e" : pct >= 0.25 ? "#eab308" : "#ef4444";
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  const size = 140;
  const cx = size / 2;
  const bigR = 56;
  const bigCircumference = 2 * Math.PI * bigR;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={bigR} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx={cx} cy={cx} r={bigR}
          fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={bigCircumference}
          strokeDashoffset={bigCircumference * (1 - (display / max))}
          style={{ transition: "stroke-dashoffset 0.03s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "var(--font-headline)", fontSize: "2.25rem", lineHeight: 1 }}>{display}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-dim)" }}>/ {max}</span>
      </div>
    </div>
  );
}

export default function InterrogationChat({
  interrogationId,
  taskId,
  userName,
  onComplete,
}: {
  interrogationId: string;
  checkinId: string;
  taskId?: string;
  userName: string;
  onComplete: () => void;
}) {
  const [question, setQuestion] = useState<OpenQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [questionNum, setQuestionNum] = useState(1);
  const [runningScore, setRunningScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [passed, setPassed] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [apiError, setApiError] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  // "I'm stuck" AI tutor state
  const [showTutor, setShowTutor] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorHint, setTutorHint] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmittedRef = useRef(false);

  // Lock sidebar during exam
  useEffect(() => {
    const nav = document.querySelector(".dashboard-sidebar") as HTMLElement | null;
    const hamburger = document.querySelector(".dashboard-hamburger") as HTMLElement | null;
    const main = document.querySelector(".dashboard-main") as HTMLElement | null;
    if (nav) { nav.style.filter = "blur(8px)"; nav.style.pointerEvents = "none"; nav.style.opacity = "0.3"; }
    if (hamburger) hamburger.style.display = "none";
    if (main) { main.style.marginLeft = "0"; main.style.padding = "1.5rem"; }
    return () => {
      if (nav) { nav.style.filter = ""; nav.style.pointerEvents = ""; nav.style.opacity = ""; }
      if (hamburger) hamburger.style.display = "";
      if (main) { main.style.marginLeft = ""; main.style.padding = ""; }
    };
  }, []);

  // Trigger reveal animation shortly after completion
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowReveal(true), 300);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  const fetchQuestion = useCallback(async (num: number) => {
    setLoading(true);
    setAnswerResult(null);
    setAnswerText("");
    setTimeLeft(SECONDS_PER_QUESTION);
    autoSubmittedRef.current = false;
    setApiError(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
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
  }, [interrogationId]);

  useEffect(() => { fetchQuestion(1); }, [fetchQuestion]);

  const submitAnswer = useCallback(async (text: string) => {
    if (submitting || answerResult) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(`/api/interrogations/${interrogationId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionNumber: questionNum, answerText: text, timeSpent: SECONDS_PER_QUESTION - timeLeft }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      setSubmitting(false);

      const result: AnswerResult = {
        score: data.score ?? 0,
        feedback: data.feedback ?? "",
        hitKeypoints: data.hitKeypoints ?? [],
        missedKeypoints: data.missedKeypoints ?? [],
      };
      setAnswerResult(result);
      setRunningScore((s) => s + result.score);

      if (data.completed) {
        setIsComplete(true);
        setPassed(data.passed);
        setTotalScore(data.totalScore ?? 0);
        setVerdict(data.verdict ?? "");
      }
    } catch {
      setSubmitting(false);
      setApiError(true);
    }
  }, [interrogationId, questionNum, timeLeft, submitting, answerResult]);

  // Timer — auto-submit on expiry
  useEffect(() => {
    if (loading || answerResult || isComplete) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            submitAnswer(answerText || "(no answer submitted — time expired)");
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, answerResult, isComplete, submitAnswer, answerText]);

  const nextQuestion = () => {
    const next = questionNum + 1;
    setQuestionNum(next);
    fetchQuestion(next);
  };

  const handleAskTutor = async () => {
    if (!taskId) return;
    setTutorLoading(true);
    setTutorHint("");
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, question: tutorQuestion }),
      });
      const data = await res.json();
      setTutorHint(data.hint ?? "Ask me a specific question about what you're stuck on.");
    } catch {
      setTutorHint("Tutor unavailable right now. Review your task notes and try again.");
    } finally {
      setTutorLoading(false);
    }
  };

  const renderQuestionText = (text: string) => {
    const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);
    return parts.map((part, i) => {
      const codeMatch = part.match(/```([\w]*)\n([\s\S]*?)```/);
      if (codeMatch) {
        return (
          <div key={i} className="code-block" style={{ margin: "0.75rem 0" }}
            dangerouslySetInnerHTML={{ __html: highlightCode(codeMatch[2], codeMatch[1] || "javascript") }}
          />
        );
      }
      return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
    });
  };

  // ───────────────────────── DRAMATIC COMPLETION REVEAL ─────────────────────────
  if (isComplete) {
    const maxScore = TOTAL_QUESTIONS * MAX_POINTS;
    const finalScore = totalScore || runningScore;
    const passColor = passed ? "var(--green)" : "var(--red)";
    const passGlow = passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)";

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10,10,18,0.92)",
        backdropFilter: "blur(12px)",
        padding: "1.5rem",
      }}>
        <AnimatePresence>
          {showReveal && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{
                width: "100%", maxWidth: "560px",
                background: "var(--bg-panel)",
                border: `1px solid ${passColor}`,
                borderRadius: "16px",
                padding: "2.5rem",
                textAlign: "center",
                boxShadow: `0 0 60px ${passGlow}, 0 0 120px ${passGlow}`,
              }}
            >
              {/* Verdict label */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  fontFamily: "var(--font-headline)",
                  fontSize: "clamp(3rem, 12vw, 5rem)",
                  letterSpacing: "0.1em",
                  color: passColor,
                  lineHeight: 1,
                  marginBottom: "0.5rem",
                  textShadow: `0 0 30px ${passColor}`,
                }}
              >
                {passed ? "PASSED" : "FAILED"}
              </motion.div>

              {/* Score ring */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ marginBottom: "1.5rem" }}
              >
                <AnimatedScore target={finalScore} max={maxScore} />
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
                  need {PASS_THRESHOLD} to pass
                </div>
              </motion.div>

              {/* THE PROFESSOR's verdict */}
              {verdict && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    background: "rgba(137,180,250,0.06)",
                    border: "1px solid rgba(137,180,250,0.2)",
                    borderRadius: "10px",
                    padding: "1.25rem 1.5rem",
                    marginBottom: "1.75rem",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--blue)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.625rem" }}>
                    ⚡ THE PROFESSOR
                  </div>
                  <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.75 }}>{verdict}</p>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <button
                  onClick={onComplete}
                  className="forge-btn forge-btn-primary"
                  style={{ width: "100%", padding: "1rem", fontSize: "1rem" }}
                >
                  {passed ? "Back to Dashboard →" : "Back to Dashboard"}
                </button>

                {/* Share your win — only on pass */}
                {passed && (() => {
                  const maxScore = TOTAL_QUESTIONS * MAX_POINTS;
                  const shareText = `Just passed a The Forge interrogation ⚡\n${totalScore || runningScore}/${maxScore} pts · Proof-of-work AI accountability\n\nIf you're learning to code and want real accountability → theforge.app`;
                  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                  const handleCopy = () => {
                    navigator.clipboard.writeText(shareText).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    });
                  };
                  return (
                    <div style={{
                      background: "rgba(245,158,11,0.05)",
                      border: "1px solid rgba(245,158,11,0.15)",
                      borderRadius: "10px",
                      padding: "1rem 1.25rem",
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.625rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Share2 size={11} /> Share Your Win
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.875rem" }}>
                        {shareText}
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <a
                          href={tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                            padding: "0.5rem",
                            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px", textDecoration: "none",
                            color: "var(--text-primary)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8125rem",
                            transition: "background 0.15s",
                          }}
                        >
                          Post on X / Twitter
                        </a>
                        <button
                          onClick={handleCopy}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            padding: "0.5rem 0.875rem",
                            background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                            border: copied ? "1px solid var(--green)" : "1px solid var(--border)",
                            borderRadius: "6px", cursor: "pointer",
                            color: copied ? "var(--green)" : "var(--text-secondary)",
                            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.8125rem",
                            transition: "all 0.2s",
                          }}
                        >
                          {copied ? <><CheckCheck size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* "I'm stuck" tutor — only after fail */}
                {!passed && taskId && (
                  <div>
                    <button
                      onClick={() => setShowTutor(!showTutor)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center",
                        width: "100%", padding: "0.75rem",
                        background: "rgba(137,180,250,0.06)", border: "1px solid rgba(137,180,250,0.2)",
                        borderRadius: "8px", cursor: "pointer", color: "var(--blue)",
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.875rem",
                        transition: "background 0.15s",
                      }}
                    >
                      <HelpCircle size={16} />
                      I&apos;m stuck — get a hint from the tutor
                    </button>

                    <AnimatePresence>
                      {showTutor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden", marginTop: "0.75rem" }}
                        >
                          <div className="forge-card" style={{ padding: "1.25rem", textAlign: "left" }}>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                              Tell me what confused you. I&apos;ll guide you without giving away the answer.
                            </p>
                            <textarea
                              value={tutorQuestion}
                              onChange={(e) => setTutorQuestion(e.target.value)}
                              placeholder="e.g. I don't understand why my useEffect is running twice..."
                              style={{
                                width: "100%", minHeight: "80px", padding: "0.75rem",
                                background: "rgba(30,30,46,0.4)", border: "1px solid var(--border)",
                                borderRadius: "6px", color: "var(--text-primary)", fontFamily: "var(--font-body)",
                                fontSize: "0.875rem", lineHeight: 1.5, resize: "vertical", outline: "none",
                                marginBottom: "0.75rem",
                              }}
                            />
                            <button
                              onClick={handleAskTutor}
                              disabled={tutorLoading || !tutorQuestion.trim()}
                              className="forge-btn forge-btn-primary"
                              style={{ padding: "0.625rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", opacity: tutorLoading || !tutorQuestion.trim() ? 0.5 : 1 }}
                            >
                              {tutorLoading ? <><Loader2 size={14} className="animate-spin" /> Thinking...</> : "Ask the tutor"}
                            </button>

                            {tutorHint && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "1rem" }}>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--blue)", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>
                                  TUTOR
                                </div>
                                <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.7 }}>{tutorHint}</p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state before reveal animation */}
        {!showReveal && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", fontSize: "0.875rem", letterSpacing: "0.15em" }}>
              COMPUTING VERDICT...
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ───────────────────────────────── ACTIVE EXAM ─────────────────────────────────
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      {/* Exam header bar */}
      <div
        className="forge-panel"
        style={{
          position: "sticky", top: 0, zIndex: 10,
          padding: "1rem 1.5rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--blue)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            ⚡ THE PROFESSOR &nbsp;·&nbsp; {userName}
          </div>
          <div style={{ fontFamily: "var(--font-headline)", fontSize: "1.0625rem", marginTop: "0.125rem" }}>
            Question {questionNum}/{TOTAL_QUESTIONS}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.125rem" }}>
            {runningScore} pts &nbsp;·&nbsp; need {PASS_THRESHOLD} total to pass
          </div>
        </div>
        <TimerRing timeLeft={timeLeft} total={SECONDS_PER_QUESTION} />
      </div>

      {/* Question progress dots */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.25rem" }}>
        {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
          <div
            key={i}
            style={{
              width: i < questionNum - 1 ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i < questionNum - 1
                ? "var(--green)"
                : i === questionNum - 1
                  ? "var(--accent)"
                  : "var(--border)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="forge-panel"
            style={{ padding: "3rem", textAlign: "center" }}
          >
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <Loader2 size={28} color="var(--blue)" className="animate-spin" />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--blue)", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
              THE PROFESSOR IS REVIEWING YOUR WORK...
            </div>
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Question {questionNum} of {TOTAL_QUESTIONS}
            </div>
          </motion.div>
        ) : apiError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="forge-panel"
            style={{ padding: "2rem", textAlign: "center" }}
          >
            <div style={{ color: "var(--red)", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <AlertTriangle size={18} /> Failed to load question. AI service may be down.
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => fetchQuestion(questionNum)} className="forge-btn forge-btn-ghost">Retry</button>
              <button onClick={onComplete} className="forge-btn forge-btn-ghost" style={{ color: "var(--text-dim)" }}>Back</button>
            </div>
          </motion.div>
        ) : question ? (
          <motion.div
            key={`q-${questionNum}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="forge-panel" style={{ padding: "1.5rem 2rem", marginBottom: "1rem" }}>
              {/* Question header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.15em", textTransform: "uppercase",
                  padding: "0.1875rem 0.625rem", borderRadius: "3px", fontWeight: 700,
                  background: "rgba(137,180,250,0.12)", color: "var(--blue)", border: "1px solid rgba(137,180,250,0.25)",
                }}>
                  Q{questionNum} · {question.type}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.5625rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.1875rem 0.625rem", borderRadius: "3px",
                  background: "rgba(245,158,11,0.08)", color: "var(--accent)", border: "1px solid rgba(245,158,11,0.2)",
                }}>
                  EXPLAIN IN YOUR OWN WORDS
                </span>
              </div>

              {/* Question text */}
              <div style={{ fontSize: "1.0625rem", lineHeight: 1.75, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
                {renderQuestionText(question.question)}
              </div>

              {/* Answer textarea */}
              {!answerResult && (
                <>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={submitting}
                    placeholder="Answer in your own words. Reference what you actually built — not a textbook definition. The Professor wants to hear YOUR understanding."
                    style={{
                      width: "100%", minHeight: "200px", padding: "0.875rem 1rem",
                      background: "rgba(30,30,46,0.4)", border: "1px solid var(--border)", borderRadius: "8px",
                      color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.9375rem",
                      lineHeight: 1.65, resize: "vertical", outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blue)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.875rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: answerText.length < MIN_ANSWER_LEN ? "var(--text-dim)" : "var(--green)" }}>
                      {answerText.length} chars{answerText.length < MIN_ANSWER_LEN ? ` · need ${MIN_ANSWER_LEN}+` : " · ready"}
                    </div>
                    <button
                      type="button"
                      onClick={() => submitAnswer(answerText)}
                      disabled={submitting || answerText.trim().length < MIN_ANSWER_LEN}
                      className="forge-btn forge-btn-primary"
                      style={{
                        padding: "0.75rem 2rem",
                        opacity: (submitting || answerText.trim().length < MIN_ANSWER_LEN) ? 0.5 : 1,
                        display: "flex", alignItems: "center", gap: "0.5rem",
                      }}
                    >
                      {submitting ? <><Loader2 size={14} className="animate-spin" /> The Professor is grading...</> : "Submit Answer →"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Graded feedback */}
            {answerResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="forge-card"
                  style={{
                    padding: "1.25rem 1.5rem", marginBottom: "1rem",
                    borderColor: answerResult.score >= 7 ? "var(--green)" : answerResult.score >= 4 ? "var(--yellow)" : "var(--red)",
                    background: answerResult.score >= 7 ? "rgba(34,197,94,0.04)" : answerResult.score >= 4 ? "rgba(234,179,8,0.04)" : "rgba(239,68,68,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--blue)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      ⚡ THE PROFESSOR
                    </div>
                    <div style={{
                      fontFamily: "var(--font-headline)", fontSize: "1.75rem",
                      color: answerResult.score >= 7 ? "var(--green)" : answerResult.score >= 4 ? "var(--yellow)" : "var(--red)",
                    }}>
                      {answerResult.score}/{MAX_POINTS}
                    </div>
                  </div>
                  <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.75, marginBottom: "0.875rem" }}>
                    {answerResult.feedback}
                  </p>
                  {(answerResult.hitKeypoints.length > 0 || answerResult.missedKeypoints.length > 0) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                      {answerResult.hitKeypoints.map((k, i) => (
                        <div key={`hit-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--green)" }}>
                          <Check size={14} style={{ flexShrink: 0, marginTop: "2px" }} /><span>{k}</span>
                        </div>
                      ))}
                      {answerResult.missedKeypoints.map((k, i) => (
                        <div key={`miss-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          <X size={14} style={{ flexShrink: 0, marginTop: "2px" }} /><span>Could strengthen: {k}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {questionNum < TOTAL_QUESTIONS ? (
                  <button
                    onClick={nextQuestion}
                    className="forge-btn forge-btn-blue"
                    style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
                  >
                    Next Question ({questionNum + 1}/{TOTAL_QUESTIONS}) →
                  </button>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem" }}>
                    <Loader2 size={20} color="var(--text-dim)" className="animate-spin" style={{ margin: "0 auto 0.5rem", display: "block" }} />
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
                      THE PROFESSOR IS DELIBERATING...
                    </div>
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
