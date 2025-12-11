"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, ExternalLink, Sparkles, Key, ChevronDown, ChevronUp, AlertCircle, Zap, Wand2, Lamp, Eye, EyeOff } from "lucide-react";

const API_KEY_STORAGE = "promptgenie_api_key";

interface PromptRequest {
  api_key: string;
  goal: string;
  context?: string;
  constraints?: string;
  tone?: string;
  output_format?: string;
  subject?: string;
}

interface PromptResponse {
  prompt: string;
  explanation: string;
}

const AI_PLATFORMS = [
  { name: "ChatGPT", url: "https://chat.openai.com/", svg: "/chatgpt.svg" },
  { name: "Claude", url: "https://claude.ai/new", svg: "/claude.svg" },
  { name: "Gemini", url: "https://gemini.google.com/", svg: "/gemini.svg" },
  { name: "DeepSeek", url: "https://chat.deepseek.com/", svg: "/deepseek.svg" },
];

// Magic Lamp SVG Component
const MagicLamp = ({ className = "", glowing = false }: { className?: string; glowing?: boolean }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Lamp Base */}
    <ellipse cx="100" cy="180" rx="50" ry="15" fill="url(#lampGradient)" opacity="0.8" />
    <ellipse cx="100" cy="175" rx="45" ry="12" fill="url(#lampGradient)" />
    
    {/* Lamp Body */}
    <path
      d="M 80 175 Q 100 120 100 120 Q 100 120 120 175 Z"
      fill="url(#lampGradient)"
      className={glowing ? "drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" : ""}
    />
    
    {/* Lamp Spout */}
    <path
      d="M 95 120 L 100 100 L 105 120 Z"
      fill="url(#lampGradient)"
    />
    
    {/* Glow Effect */}
    {glowing && (
      <>
        <circle cx="100" cy="110" r="15" fill="rgba(255,215,0,0.3)" className="animate-pulse" />
        <circle cx="100" cy="110" r="10" fill="rgba(255,255,255,0.5)" className="animate-pulse" />
      </>
    )}
    
    {/* Smoke/Magic Particles */}
    {glowing && (
      <>
        <circle cx="90" cy="95" r="2" fill="rgba(255,215,0,0.6)" className="animate-bounce" style={{ animationDelay: "0s", animationDuration: "2s" }} />
        <circle cx="100" cy="90" r="2" fill="rgba(255,215,0,0.6)" className="animate-bounce" style={{ animationDelay: "0.3s", animationDuration: "2s" }} />
        <circle cx="110" cy="95" r="2" fill="rgba(255,215,0,0.6)" className="animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "2s" }} />
      </>
    )}
    
    <defs>
      <linearGradient id="lampGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#FFA500" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FF8C00" stopOpacity="0.9" />
      </linearGradient>
    </defs>
  </svg>
);

// Genie Character SVG Component
const GenieCharacter = ({ className = "", floating = false }: { className?: string; floating?: boolean }) => (
  <svg
    viewBox="0 0 200 200"
    className={`${className} ${floating ? "animate-bounce" : ""}`}
    style={{ animationDuration: "3s" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Genie Body (Cloud-like) */}
    <ellipse cx="100" cy="140" rx="60" ry="50" fill="url(#genieGradient)" />
    
    {/* Genie Head */}
    <circle cx="100" cy="80" r="35" fill="url(#genieGradient)" />
    
    {/* Turban */}
    <ellipse cx="100" cy="60" rx="40" ry="15" fill="#8B5CF6" />
    <ellipse cx="100" cy="55" rx="35" ry="12" fill="#A78BFA" />
    <circle cx="100" cy="50" r="8" fill="#FCD34D" />
    
    {/* Eyes */}
    <circle cx="90" cy="80" r="4" fill="#1F2937" />
    <circle cx="110" cy="80" r="4" fill="#1F2937" />
    
    {/* Smile */}
    <path
      d="M 85 90 Q 100 100 115 90"
      stroke="#1F2937"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Arms */}
    <ellipse cx="60" cy="120" rx="20" ry="30" fill="url(#genieGradient)" />
    <ellipse cx="140" cy="120" rx="20" ry="30" fill="url(#genieGradient)" />
    
    {/* Magic Sparkles */}
    <circle cx="70" cy="100" r="3" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: "0s" }} />
    <circle cx="130" cy="100" r="3" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
    <circle cx="100" cy="110" r="2" fill="#FCD34D" className="animate-pulse" style={{ animationDelay: "1s" }} />
    
    <defs>
      <linearGradient id="genieGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.9" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Home() {
  const [form, setForm] = useState<PromptRequest>({
    api_key: "",
    goal: "",
    context: "",
    constraints: "",
    tone: "",
    output_format: "",
    subject: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [lampGlowing, setLampGlowing] = useState(false);
  const apiKeyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE);
    if (stored) {
      setForm((prev) => ({ ...prev, api_key: stored }));
    }
  }, []);

  useEffect(() => {
    if (form.api_key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, form.api_key.trim());
    }
  }, [form.api_key]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setLampGlowing(loading || !!prompt);
  }, [loading, prompt]);

  // Close API key panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        apiKeyPanelRef.current &&
        !apiKeyPanelRef.current.contains(event.target as Node) &&
        showKeyPanel
      ) {
        setShowKeyPanel(false);
      }
    }

    if (showKeyPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showKeyPanel]);

  const disabled = useMemo(
    () => !form.api_key.trim() || !form.goal.trim() || loading,
    [form.api_key, form.goal, loading]
  );

  async function generatePrompt(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.api_key.trim()) {
      setError("Please set your API key first.");
      setShowKeyPanel(true);
      setToast({ message: "API key is required", type: "error" });
      return;
    }
    setLoading(true);
    setError("");
    setErrorDetail("");
    setPrompt("");
    setExplanation("");
    setCopied(false);
    
    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: form.api_key.trim(),
          goal: form.goal.trim(),
          context: form.context?.trim() || "",
          constraints: form.constraints?.trim() || "",
          tone: form.tone?.trim() || "",
          output_format: form.output_format?.trim() || "",
          subject: form.subject?.trim() || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail || data?.message || "Something went wrong.";
        const isQuotaError = 
          res.status === 429 ||
          detail.toLowerCase().includes("quota") ||
          detail.toLowerCase().includes("rate limit") ||
          detail.toLowerCase().includes("billing") ||
          detail.toLowerCase().includes("api key quota");
        
        if (isQuotaError) {
          setError("API Quota Exceeded");
          setErrorDetail(
            "Your Gemini API quota has been reached. To continue using PromptGenie, please:\n\n" +
            "1. Start a billing service on your Google Cloud account\n" +
            "2. Generate a new Gemini API key with available quota\n" +
            "3. Update your API key in the settings"
          );
        } else {
          setError(detail);
          setErrorDetail(typeof data === "string" ? data : JSON.stringify(data, null, 2));
        }
        setToast({ message: isQuotaError ? "API Quota Exceeded" : detail, type: "error" });
        return;
      }

      setPrompt(data.prompt);
      setExplanation(data.explanation);
      setToast({ message: "✨ Prompt generated successfully!", type: "success" });
    } catch (err) {
      const errorMsg = "Unable to connect to the server. Please ensure the backend is running.";
      setError(errorMsg);
      setErrorDetail(
        err instanceof Error ? err.message : "Network or server unreachable."
      );
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setToast({ message: "✨ Prompt copied to clipboard!", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setToast({ message: "Failed to copy prompt", type: "error" });
    }
  }

  async function copyAndRedirect(platform: typeof AI_PLATFORMS[0]) {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setToast({ message: `✨ Prompt copied! Opening ${platform.name}...`, type: "success" });
      setTimeout(() => {
        window.open(platform.url, "_blank");
      }, 500);
    } catch {
      setToast({ message: "Failed to copy prompt", type: "error" });
    }
  }

  const isQuotaError =
    error.toLowerCase().includes("quota") ||
    errorDetail.toLowerCase().includes("quota") ||
    errorDetail.toLowerCase().includes("billing") ||
    errorDetail.toLowerCase().includes("rate limit");

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 text-zinc-50">
      {/* Animated Background Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-10 top-32 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating Genie Character */}
      <div className="pointer-events-none fixed right-8 top-1/4 z-10 hidden lg:block">
        <GenieCharacter className="h-32 w-32 opacity-20" floating={true} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-100 shadow-emerald-500/20"
                : "border-red-500/50 bg-red-500/20 text-red-100 shadow-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Panel */}
      <div ref={apiKeyPanelRef} className="fixed top-4 right-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setShowKeyPanel((s) => !s)}
          className="group flex items-center gap-2 rounded-xl border border-white/10 bg-linear-to-r from-indigo-600/20 to-purple-600/20 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:from-indigo-600/30 hover:to-purple-600/30 hover:shadow-indigo-500/20 cursor-pointer"
        >
          <Key className="h-4 w-4 transition-transform group-hover:rotate-12" />
          {showKeyPanel ? "Hide API Key" : "Show API Key"}
        </button>
        {showKeyPanel && (
          <div className="w-96 rounded-2xl border cursor-pointer border-white/10 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">API Key Settings</h3>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-400">
              Your API key is securely stored locally in your browser. Never share your API key with anyone.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    name="api_key"
                    type={showApiKey ? "text" : "password"}
                    value={form.api_key}
                    onChange={handleChange}
                    placeholder="Enter your Gemini API key (sk-...)"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-400 cursor-pointer"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-center text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20"
                >
                  Get API Key
                </a>
                <button
                  type="button"
                  onClick={() => setShowKeyPanel(false)}
                  className="flex-1 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-medium text-white transition hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-12 px-6 py-16 md:px-12 md:py-20">
        {/* Header with Magic Lamp */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-linear-to-r from-amber-500/20 to-yellow-500/20 blur-2xl" />
            {/* <MagicLamp className="h-20 w-20 md:h-24 md:w-24" glowing={lampGlowing} /> */}
          </div>
          <div className="space-y-3">
            <h1 className="bg-linear-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
              PromptGenie
            </h1>
            <h3>Your AI Prompt Wizard</h3>
          </div>
        </div>

        {/* Main Content */}
        <section className="grid gap-8 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="relative flex flex-col gap-6 rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-7 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-indigo-500/5 to-purple-500/5" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Wand2 className="h-5 w-5 text-indigo-400" />
                  Your Wish
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Tell the genie what you need
                </p>
              </div>
            </div>

            <form onSubmit={generatePrompt} className="space-y-5">
              {!form.api_key.trim() && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-200">API Key Required</span>
                  </div>
                  <input
                    name="api_key"
                    type={showKeyPanel ? "text" : "password"}
                    value={form.api_key}
                    onChange={handleChange}
                    placeholder="Enter your Gemini API key"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="mt-2 text-xs text-amber-300/80">
                    Click the API Key button in the top right to manage your key securely.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKeyPanel(true)}
                    className="mt-2 text-xs text-amber-300/80 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    Show API Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKeyPanel(false)}
                    className="mt-2 text-xs text-amber-300/80 cursor-pointer"
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide API Key
                  </button>
                </div>
              )}

              <div>
                <label className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Goal</span>
                  <span className="text-xs text-slate-500">Required</span>
                </label>
                <textarea
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  placeholder="e.g., Write a product announcement email for a new AI feature that explains the benefits to non-technical users"
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border cursor-pointer border-white/10 bg-slate-950/30 px-4 py-2.5 text-sm font-medium text-indigo-400 transition hover:bg-slate-950/50 hover:text-indigo-300"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>

              {showAdvanced && (
                <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Context</label>
                    <textarea
                      name="context"
                      value={form.context}
                      onChange={handleChange}
                      placeholder="Audience, background info..."
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Constraints</label>
                    <textarea
                      name="constraints"
                      value={form.constraints}
                      onChange={handleChange}
                      placeholder="Word count, requirements..."
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Tone</label>
                    <input
                      name="tone"
                      value={form.tone}
                      onChange={handleChange}
                      placeholder="Professional, casual, friendly..."
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Output Format</label>
                    <input
                      name="output_format"
                      value={form.output_format}
                      onChange={handleChange}
                      placeholder="Bullets, JSON, markdown..."
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Subject</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="Main topic or product name"
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className={`rounded-xl border p-4 ${
                  isQuotaError
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }`}>
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${isQuotaError ? "text-amber-400" : "text-red-400"}`} />
                    <span className={`text-sm font-semibold ${isQuotaError ? "text-amber-200" : "text-red-200"}`}>
                      {error}
                    </span>
                  </div>
                  {isQuotaError && (
                    <div className="mt-3 space-y-2 text-sm text-amber-200/90">
                      <p className="whitespace-pre-line leading-relaxed">{errorDetail}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href="https://cloud.google.com/billing/docs/how-to/manage-billing-account"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/30"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Start Billing Service
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/30"
                        >
                          <Key className="h-3.5 w-3.5" />
                          Generate New API Key
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {!isQuotaError && errorDetail && (
                    <p className="mt-2 text-xs text-red-200/80">{errorDetail}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={disabled}
                className="group flex w-full items-center justify-center gap-2.5 cursor-pointer rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-[200%_100%] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-size-[100%_100%] hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-indigo-500/25"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Summoning the Genie...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>Generate Prompt</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Output Panel */}
          <div className="relative flex flex-col gap-6 rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/80 to-slate-800/50 p-7 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-purple-500/5 to-indigo-500/5" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Lamp className="h-5 w-5 text-purple-400" />
                  Generated Prompt
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your optimized prompt ready to use
                </p>
              </div>
              {prompt && (
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex items-center gap-2 rounded-lg border cursor-pointer border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {/* Prompt Display */}
            <div className="min-h-[250px] rounded-xl border border-white/10 bg-slate-950/50 p-5">
              {!prompt && !loading && (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="space-y-2">
                    <MagicLamp className="mx-auto h-16 w-16 opacity-30" glowing={false} />
                    <p className="text-sm text-slate-500">
                      Your generated prompt will appear here
                    </p>
                  </div>
                </div>
              )}
              {loading && (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <MagicLamp className="h-20 w-20" glowing={true} />
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="relative mx-auto h-8 w-8">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                      <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">The genie is crafting your prompt...</p>
                    <p className="text-xs text-slate-500">This may take a moment</p>
                  </div>
                </div>
              )}
              {prompt && !loading && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 text-slate-200 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-slate-200">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-slate-200">{children}</ol>,
                      li: ({ children }) => <li className="text-slate-200">{children}</li>,
                      code: ({ children }) => (
                        <code className="rounded bg-slate-800/50 px-1.5 py-0.5 text-xs text-indigo-300">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {prompt}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* AI Platform Links */}
            {prompt && !loading && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Use with AI Platform
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {AI_PLATFORMS.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => copyAndRedirect(platform)}
                      className="group flex items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-white transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
                    >
                      <img 
                        src={platform.svg} 
                        alt={platform.name} 
                        className="h-5 w-5 transition-transform group-hover:scale-110" 
                      />
                      <span>{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {explanation && !loading && (
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Explanation
                  </p>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-300">{children}</p>,
                    }}
                  >
                    {explanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
