"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import InterrogationChat from "./InterrogationChat";

interface Task {
  id: string;
  title: string;
  detail: string;
  status: string;
  sortOrder: number;
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedTrackId, setSelectedTrackId] = useState(roadmap.tracks[0]?.id ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Interrogation state
  const [interrogationId, setInterrogationId] = useState<string | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);

  const selectedTrack = roadmap.tracks.find((t) => t.id === selectedTrackId);
  const availableTasks = selectedTrack?.phases
    .flatMap((p) => p.tasks.filter((t) => t.status === "available" || t.status === "in_progress"))
    ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedTaskId) { setError("Select a task."); return; }
    if (description.trim().length < 50) { setError("Description must be at least 50 characters."); return; }
    if (!screenshot) { setError("Screenshot evidence is required."); return; }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("roadmapId", roadmap.id);
      formData.append("trackId", selectedTrackId);
      formData.append("taskId", selectedTaskId);
      formData.append("description", description);
      formData.append("screenshot", screenshot);

      const res = await fetch("/api/checkins", { method: "POST", body: formData });
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

  // If interrogation started, show the interrogation chat
  if (interrogationId && checkinId) {
    return (
      <InterrogationChat
        interrogationId={interrogationId}
        checkinId={checkinId}
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
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
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
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
                letterSpacing: "0.05em",
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
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
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
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.9375rem" }}>{task.title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{task.detail.slice(0, 100)}...</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          What Did You Build? <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="forge-input"
          style={{ minHeight: "140px", resize: "vertical" }}
          placeholder="Describe exactly what you built, learned, or accomplished today. Be specific — the AI will interrogate you on this. Min 50 characters."
          required
          minLength={50}
        />
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.6875rem", color: description.length < 50 ? "var(--red)" : "var(--text-dim)", textAlign: "right", marginTop: "0.375rem" }}>
          {description.length} / min 50
        </div>
      </div>

      {/* Screenshot */}
      <div className="forge-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Screenshot Evidence <span style={{ color: "var(--red)" }}>*</span>
        </label>

        {screenshotPreview ? (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshotPreview} alt="Evidence screenshot" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "6px", border: "1px solid var(--border)", background: "#000" }} />
            <button
              type="button"
              onClick={() => { setScreenshot(null); setScreenshotPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.8)", color: "var(--red)", border: "1px solid var(--red)", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "2rem", border: "2px dashed var(--border)", borderRadius: "6px", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9375rem", transition: "all 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            📸 Click to upload screenshot
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      </div>

      <button
        type="submit"
        className="forge-btn forge-btn-primary"
        style={{ width: "100%", padding: "1rem", fontSize: "1rem" }}
        disabled={submitting || !selectedTaskId || description.length < 50 || !screenshot}
      >
        {submitting ? "Submitting..." : "🔬 START INTERROGATION"}
      </button>
    </form>
  );
}
