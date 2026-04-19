"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, FlaskConical, Clock, Loader2, CheckCircle2 } from "lucide-react";
import InterrogationChat from "./InterrogationChat";

interface Task {
  id: string;
  title: string;
  detail: string;
  status: string;
  sortOrder: number;
  estimatedHours?: number | null;
}

interface Phase {
  id: string;
  title: string;
  tasks: Task[];
}

interface Track {
  id: string;
  title: string;
  color: string;
  phases: Phase[];
}

interface Roadmap {
  id: string;
  title: string;
  tracks: Track[];
}

export default function CheckinForm({
  roadmap,
  userId,
  userName,
}: {
  roadmap: Roadmap;
  userId: string;
  userName: string;
}) {
  const router = useRouter();

  const [selectedTrackId, setSelectedTrackId] = useState(roadmap.tracks[0]?.id ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [interrogationId, setInterrogationId] = useState<string | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);

  const selectedTrack = roadmap.tracks.find((t) => t.id === selectedTrackId);
  const availableTasks = selectedTrack?.phases
    .flatMap((p) => p.tasks.filter((t) => t.status === "available" || t.status === "in_progress"))
    ?? [];

  const selectedTask = availableTasks.find((t) => t.id === selectedTaskId);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedTaskId) { setError("Select a task."); return; }
    if (description.trim().length < 50) { setError("Description must be at least 50 characters."); return; }
    if (!projectUrl.trim()) { setError("A project URL is required (GitHub repo, deployed app, etc.)."); return; }
    if (!isValidUrl(projectUrl.trim())) { setError("Please enter a valid URL starting with http:// or https://"); return; }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          trackId: selectedTrackId,
          taskId: selectedTaskId,
          description,
          projectUrl: projectUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Submission failed.");
        setSubmitting(false);
        return;
      }

      setCheckinId(data.checkinId);
      setInterrogationId(data.interrogationId);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (interrogationId && checkinId) {
    return (
      <InterrogationChat
        interrogationId={interrogationId}
        checkinId={checkinId}
        taskId={selectedTaskId}
        userName={userName}
        onComplete={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "680px" }}>
      {error && (
        <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1.5rem", color: "var(--red)", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {/* Track selector */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Track
        </label>
        <div className="flex gap-2 flex-wrap">
          {roadmap.tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => { setSelectedTrackId(track.id); setSelectedTaskId(""); }}
              style={{
                padding: "0.375rem 1rem",
                borderRadius: "4px",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: selectedTrackId === track.id ? `1px solid ${track.color}` : "1px solid var(--border)",
                background: selectedTrackId === track.id ? `${track.color}20` : "transparent",
                color: selectedTrackId === track.id ? track.color : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {track.title}
            </button>
          ))}
        </div>
      </div>

      {/* Task selector */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Task Completed
        </label>
        {availableTasks.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>No available tasks on this track. Check your roadmap.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableTasks.map((task) => (
              <label
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "6px",
                  border: selectedTaskId === task.id ? "1px solid var(--blue)" : "1px solid var(--border)",
                  background: selectedTaskId === task.id ? "rgba(0,200,255,0.05)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="taskId"
                  value={task.id}
                  checked={selectedTaskId === task.id}
                  onChange={() => setSelectedTaskId(task.id)}
                  style={{ accentColor: "var(--blue)", marginTop: "0.2rem" }}
                />
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "0.9375rem" }}>{task.title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{task.detail.slice(0, 120)}...</div>
                  {task.estimatedHours && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", marginTop: "0.375rem" }}>
                      <Clock size={11} /> ~{task.estimatedHours}h estimated
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          What Did You Build? <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="forge-input"
          style={{ minHeight: "140px", resize: "vertical" }}
          placeholder="Describe exactly what you built, learned, or accomplished. Be specific — The Professor will ask you about this. Min 50 characters."
          required
          minLength={50}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          {/* Progress bar */}
          <div style={{ flex: 1, height: "3px", background: "var(--border)", borderRadius: "2px", marginRight: "0.75rem", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: "2px",
              transition: "width 0.2s, background 0.2s",
              width: `${Math.min(100, (description.length / 200) * 100)}%`,
              background: description.length < 50 ? "var(--red)"
                : description.length < 100 ? "var(--yellow)"
                : "var(--green)",
            }} />
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: description.length < 50 ? "var(--red)"
              : description.length < 100 ? "var(--yellow)"
              : "var(--green)",
            transition: "color 0.2s",
            flexShrink: 0,
          }}>
            {description.length < 50
              ? `${50 - description.length} more to go`
              : description.length >= 150
              ? "✓ Detailed"
              : `${description.length} chars`
            }
          </span>
        </div>
      </div>

      {/* Project URL */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Project URL <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", marginBottom: "0.875rem", lineHeight: 1.5 }}>
          Link to your work — GitHub repo, deployed app, CodeSandbox, etc.
        </p>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: projectUrl && isValidUrl(projectUrl) ? "var(--green)" : "var(--text-dim)" }}>
            {projectUrl && isValidUrl(projectUrl) ? <CheckCircle2 size={16} /> : <Link2 size={16} />}
          </span>
          <input
            type="url"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            className="forge-input"
            style={{
              paddingLeft: "2.5rem",
              borderColor: projectUrl && !isValidUrl(projectUrl) ? "var(--red)"
                : projectUrl && isValidUrl(projectUrl) ? "var(--green)"
                : undefined,
              transition: "border-color 0.2s",
            }}
            placeholder="https://github.com/username/project"
            required
          />
        </div>
        {projectUrl && !isValidUrl(projectUrl) && (
          <div style={{ color: "var(--red)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            ✕ Must start with https:// or http://
          </div>
        )}
        {projectUrl && isValidUrl(projectUrl) && (
          <div style={{ color: "var(--green)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            ✓ Valid URL
          </div>
        )}
      </div>

      <button
        type="submit"
        className="forge-btn forge-btn-primary"
        style={{ width: "100%", padding: "1rem", fontSize: "1rem" }}
        disabled={submitting || !selectedTaskId || description.length < 50 || !projectUrl.trim() || (!!projectUrl && !isValidUrl(projectUrl))}
      >
        {submitting
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Loader2 size={18} className="animate-spin" />
              Starting Interrogation...
            </span>
          : <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <FlaskConical size={18} strokeWidth={1.5} />
              START INTERROGATION
            </span>
        }
      </button>

      {selectedTask && (
        <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textAlign: "center", marginTop: "1rem" }}>
          You&apos;ll answer 3 open-ended questions about <strong style={{ color: "var(--text-secondary)" }}>{selectedTask.title}</strong>. Genuine effort passes.
        </p>
      )}
    </form>
  );
}
