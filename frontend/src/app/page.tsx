"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, ExternalLink, Sparkles, Key, ChevronDown, ChevronUp } from "lucide-react";

const API_KEY_STORAGE = "promptgenie_api_key";

interface PromptRequest {
  api_key: string;
  goal: string;
  context: string;
  constraints: string;
  tone: string;
  output_format: string;
  subject: string;
}

const AI_PLATFORMS = [
  { name: "ChatGPT", url: "https://chat.openai.com/", color: "from-emerald-500 to-teal-500" },
  { name: "Claude", url: "https://claude.ai/new", color: "from-amber-500 to-orange-500" },
  { name: "Gemini", url: "https://gemini.google.com/", color: "from-blue-500 to-indigo-500" },
  { name: "DeepSeek", url: "https://chat.deepseek.com/", color: "from-purple-500 to-pink-500" },
];

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
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
          api_key: form.api_key,
          goal: form.goal,
          context: form.context,
          constraints: form.constraints,
          tone: form.tone,
          output_format: form.output_format,
          subject: form.subject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail || "Something went wrong.";
        setError(detail);
        setErrorDetail(
          res.status === 429
            ? `429: ${detail}`
            : typeof data === "string"
              ? data
              : JSON.stringify(data, null, 2)
        );
        setToast({ message: detail, type: "error" });
        return;
      }

      setPrompt(data.prompt);
      setExplanation(data.explanation);
      setToast({ message: "Prompt generated successfully!", type: "success" });
    } catch (err) {
      const errorMsg = "Backend unreachable.";
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
      setToast({ message: "Prompt copied to clipboard!", type: "success" });
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
      setToast({ message: `Prompt copied! Opening ${platform.name}...`, type: "success" });
      setTimeout(() => {
        window.open(platform.url, "_blank");
      }, 500);
    } catch {
      setToast({ message: "Failed to copy prompt", type: "error" });
    }
  }

  const isQuotaError =
    errorDetail.toLowerCase().includes("quota") ||
    errorDetail.toLowerCase().includes("429");

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-zinc-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${
            toast.type === "success" 
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100" 
              : "border-red-500/50 bg-red-500/10 text-red-100"
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-lg">⚠️</span>
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Panel */}
      <div className="fixed top-4 right-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setShowKeyPanel((s) => !s)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-white/10"
        >
          <Key className="h-4 w-4" />
          API Key
        </button>
        {showKeyPanel && (
          <div className="w-80 rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <h3 className="mb-3 text-sm font-semibold text-white">API Key</h3>
            <p className="mb-3 text-xs text-slate-400">
              Your API key is saved locally in your browser
            </p>
            <input
              name="api_key"
              value={form.api_key}
              onChange={handleChange}
              placeholder="sk-…"
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => setShowKeyPanel(false)}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-10 top-32 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 md:px-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-medium text-indigo-200 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            PromptGenie
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Craft Perfect Prompts with AI
          </h1>
          <p className="max-w-2xl text-base text-slate-400">
            Describe your goal and let the genie create an optimized prompt for any AI platform
          </p>
        </div>

        {/* Main Content */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="relative flex flex-col gap-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Your Request</h2>
                <p className="text-sm text-slate-400">
                  Tell us what you need
                </p>
              </div>
              <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                Ready ✨
              </div>
            </div>

            <div className="space-y-4">
              {!form.api_key.trim() && (
                <label className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">API Key</span>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                      Required
                    </span>
                  </div>
                  <input
                    name="api_key"
                    value={form.api_key}
                    onChange={handleChange}
                    placeholder="sk-…"
                    className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Goal</span>
                  <span className="text-xs text-slate-500">Required</span>
                </div>
                <textarea
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  placeholder="e.g., Write a product announcement email for a new AI feature"
                  className="min-h-[100px] w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAdvanced ? "Hide" : "Show"} optional details
              </button>

              {showAdvanced && (
                <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-300">Context</span>
                    <textarea
                      name="context"
                      value={form.context}
                      onChange={handleChange}
                      placeholder="Audience, background info..."
                      className="min-h-[80px] w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-300">Constraints</span>
                    <textarea
                      name="constraints"
                      value={form.constraints}
                      onChange={handleChange}
                      placeholder="Word count, requirements..."
                      className="min-h-[80px] w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-300">Tone</span>
                    <input
                      name="tone"
                      value={form.tone}
                      onChange={handleChange}
                      placeholder="Professional, casual..."
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-300">Output Format</span>
                    <input
                      name="output_format"
                      value={form.output_format}
                      onChange={handleChange}
                      placeholder="Bullets, JSON, markdown..."
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-300">Subject</span>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="Main topic or product"
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => generatePrompt()}
              disabled={disabled}
              className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Prompt
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="relative flex flex-col gap-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Generated Prompt</h2>
                <p className="text-sm text-slate-400">
                  Your optimized prompt
                </p>
              </div>
              {prompt && (
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {/* Prompt Display */}
            <div className="min-h-[200px] rounded-lg border border-white/10 bg-slate-950/50 p-4">
              {!prompt && !loading && (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-sm text-slate-500">
                    Your generated prompt will appear here
                  </p>
                </div>
              )}
              {loading && (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-400">Crafting your prompt...</p>
                </div>
              )}
              {prompt && !loading && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{prompt}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* AI Platform Links */}
            {prompt && !loading && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Use with AI Platform
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AI_PLATFORMS.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => copyAndRedirect(platform)}
                      className={`flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-linear-to-r ${platform.color} p-3 text-sm font-medium text-white shadow-lg transition hover:shadow-xl hover:scale-[1.02]`}
                    >
                      <span>{platform.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {(explanation || (loading && prompt)) && (
              <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Explanation
                </p>
                {loading && !explanation ? (
                  <p className="text-sm text-slate-500">Generating explanation...</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Error Details */}
            {errorDetail && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-red-300">
                      Error Details
                    </p>
                    <p className="text-sm font-semibold text-red-200">Request Failed</p>
                  </div>
                  {isQuotaError && (
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200">
                      Quota Error
                    </span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-xs text-red-200/90">
                  {errorDetail}
                </pre>
                {isQuotaError && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="https://ai.google.dev/gemini-api/docs/rate-limits"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Rate Limits
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://aistudio.google.com/api-keys"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Check Usage
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}