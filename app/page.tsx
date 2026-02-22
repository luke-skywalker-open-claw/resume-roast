"use client";

import { useState, useCallback } from "react";

type RoastMode = "gentle" | "savage" | "ramsay";

interface RoastResult {
  overallScore: number;
  verdict: string;
  roastLines: string[];
  strengths: string[];
  improvements: string[];
  tldr: string;
}

const modes: { id: RoastMode; emoji: string; label: string; desc: string }[] = [
  { id: "gentle", emoji: "😊", label: "Gentle", desc: "Constructive but honest" },
  { id: "savage", emoji: "🔥", label: "Savage", desc: "Brutal but fair" },
  { id: "ramsay", emoji: "💀", label: "Gordon Ramsay", desc: "Absolutely unhinged" },
];

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 10) * circumference;
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset} className="gauge-animated"
          style={{ "--gauge-offset": offset } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-zinc-500 text-sm">/10</span>
      </div>
    </div>
  );
}

function Results({ result, mode }: { result: RoastResult; mode: RoastMode }) {
  const [copied, setCopied] = useState(false);

  const shareText = `My resume just got roasted by AI: "${result.verdict}" — Score: ${result.overallScore}/10 🔥`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://resume-roast.vercel.app")}`;

  const copyResults = () => {
    const text = `ResumeRoast Results (${modes.find(m => m.id === mode)?.label} Mode)\n\nScore: ${result.overallScore}/10\nVerdict: ${result.verdict}\n\nTop Roasts:\n${result.roastLines.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\nStrengths:\n${result.strengths.map(s => `✅ ${s}`).join("\n")}\n\nImprovements:\n${result.improvements.map(s => `⚠️ ${s}`).join("\n")}\n\nTL;DR: ${result.tldr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="fade-up fade-up-1">
        <ScoreGauge score={result.overallScore} />
      </div>

      <div className="text-center fade-up fade-up-2">
        <p className="text-xl font-semibold text-zinc-200 italic">&ldquo;{result.verdict}&rdquo;</p>
      </div>

      <div className="space-y-4 fade-up fade-up-3">
        <h3 className="text-lg font-semibold text-orange-400">🔥 Top Roasts</h3>
        {result.roastLines.map((line, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-6 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-xl" />
            <p className="text-zinc-300 italic">&ldquo;{line}&rdquo;</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 fade-up fade-up-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-green-400 mb-3">✅ Strengths</h3>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-zinc-400 text-sm flex gap-2"><span className="text-green-500 mt-0.5">•</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Improvements</h3>
          <ul className="space-y-2">
            {result.improvements.map((s, i) => (
              <li key={i} className="text-zinc-400 text-sm flex gap-2"><span className="text-yellow-500 mt-0.5">•</span>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center fade-up fade-up-5">
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">TL;DR</p>
        <p className="text-zinc-200 font-medium">{result.tldr}</p>
      </div>

      <div className="flex gap-4 justify-center fade-up fade-up-5">
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-medium transition-colors">
          Share on Twitter 🐦
        </a>
        <button onClick={copyResults}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors border border-zinc-700">
          {copied ? "Copied! ✅" : "Copy Results 📋"}
        </button>
      </div>

      <div className="text-center">
        <button onClick={() => window.location.reload()}
          className="text-zinc-500 hover:text-zinc-300 underline text-sm transition-colors">
          Roast another resume →
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<RoastMode>("savage");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState("");

  const checkRateLimit = () => {
    if (typeof window === "undefined") return { allowed: true, remaining: 3 };
    const key = "resumeroast_uses";
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"date":""}');
    const today = new Date().toDateString();
    if (data.date !== today) return { allowed: true, remaining: 3 };
    return { allowed: data.count < 3, remaining: 3 - data.count };
  };

  const incrementUse = () => {
    const key = "resumeroast_uses";
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"date":""}');
    if (data.date !== today) {
      localStorage.setItem(key, JSON.stringify({ count: 1, date: today }));
    } else {
      localStorage.setItem(key, JSON.stringify({ count: data.count + 1, date: today }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") setFile(f);
    else setError("Please upload a PDF file");
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    const { allowed } = checkRateLimit();
    if (!allowed) { setError("Daily limit reached (3 roasts/day). Come back tomorrow! 🔥"); return; }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/roast", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roast failed");
      incrementUse();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center mb-2">Your Roast is Served 🍽️</h1>
        <p className="text-zinc-500 text-center mb-10">
          {modes.find(m => m.id === mode)?.emoji} {modes.find(m => m.id === mode)?.label} Mode
        </p>
        <Results result={result} mode={mode} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          ResumeRoast 🔥
        </h1>
        <p className="text-xl text-zinc-400">
          Upload your resume. Get brutally roasted by AI. Share the pain.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {modes.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              mode === m.id
                ? "border-orange-500 bg-orange-500/10"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}>
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div className="font-semibold text-sm">{m.label}</div>
            <div className="text-zinc-500 text-xs mt-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          dragging ? "border-orange-500 bg-orange-500/5" :
          file ? "border-green-500 bg-green-500/5" :
          "border-zinc-700 hover:border-zinc-500"
        }`}>
        <input id="file-input" type="file" accept=".pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        {file ? (
          <>
            <div className="text-4xl mb-3">📄</div>
            <p className="font-medium text-green-400">{file.name}</p>
            <p className="text-zinc-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB — Ready to roast</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">📎</div>
            <p className="font-medium text-zinc-300">Drop your resume PDF here</p>
            <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-center mt-4 text-sm">{error}</p>
      )}

      <button onClick={handleSubmit} disabled={!file || loading}
        className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${
          !file || loading
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-lg shadow-orange-500/20"
        }`}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Roasting your resume...
          </span>
        ) : "🔥 Roast My Resume"}
      </button>

      <p className="text-center text-zinc-600 text-xs mt-4">
        {checkRateLimit().remaining} roasts remaining today • Your resume is never stored
      </p>
    </main>
  );
}
