"use client";
import { useState } from "react";

export default function WebsiteMaker() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [tab, setTab] = useState("preview");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setHtml(""); setCss(""); setJs("");
    try {
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      setHtml(data.html || "");
      setCss(data.css || "");
      setJs(data.js || "");
      setTab("preview");
    } catch (err) {
      setError("Failed to generate website.");
    } finally {
      setLoading(false);
    }
  };

  // 📋 Copy code function
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard ✅");
  };

  // 🔍 Full screen preview function
  const openFullPreview = () => {
    const previewWindow = window.open("", "_blank");
    previewWindow.document.write(`
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}<\/script>
        </body>
      </html>
    `);
    previewWindow.document.close();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e003a] via-[#2d0a4b] to-[#0a001a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-black/60 rounded-2xl shadow-2xl p-8 border border-purple-800">
        <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center drop-shadow">AI Website Generator</h1>
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 p-4 rounded-xl border-2 border-purple-700 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            placeholder="Describe your website idea..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            disabled={loading}
          />
          <button
            className="bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white px-6 py-2 rounded-xl font-semibold shadow transition"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Building..." : "Generate"}
          </button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}

        {(html || css || js) ? (
          <div>
            <div className="flex gap-2 mb-2">
              {["preview", "html", "css", "js"].map(t => (
                <button
                  key={t}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition ${
                    tab === t
                      ? "bg-purple-700 text-white"
                      : "bg-zinc-800 text-gray-300 hover:bg-purple-900"
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Toolbar with Copy & Full Screen */}
            <div className="flex justify-end gap-2 mb-2">
              {tab !== "preview" && (
                <button
                  onClick={() => copyCode(tab === "html" ? html : tab === "css" ? css : js)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  📋 Copy {tab.toUpperCase()}
                </button>
              )}
              {tab === "preview" && (
                <button
                  onClick={openFullPreview}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  ⛶ Full Screen
                </button>
              )}
            </div>

            <div className="bg-zinc-950 border border-purple-800 p-4 rounded-b-xl overflow-auto h-[60vh] shadow-inner">
              {tab === "preview" && (
                <iframe
                  title="Website Preview"
                  className="w-full h-full bg-white rounded-lg border"
                  srcDoc={`<style>${css}</style>${html}<script>${js}<\/script>`}
                />
              )}
              {tab === "html" && (
                <pre className="text-green-400 whitespace-pre-wrap">{html}</pre>
              )}
              {tab === "css" && (
                <pre className="text-blue-400 whitespace-pre-wrap">{css}</pre>
              )}
              {tab === "js" && (
                <pre className="text-yellow-400 whitespace-pre-wrap">{js}</pre>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center mt-8">Your generated website code will appear here.</div>
        )}
      </div>
      <footer className="mt-8 text-purple-300 text-xs opacity-80">
        Made with <span className="text-pink-400">♥</span> AI Website Builder
      </footer>
    </main>
  );
}
