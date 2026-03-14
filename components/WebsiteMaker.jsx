"use client";
import { useState, useRef, useEffect } from "react";

export default function WebsiteMaker() {
  const [prompt, setPrompt] = useState(`Create a modern AI SaaS startup landing page called "NeuroFlow".

Use a dark futuristic theme with purple and blue gradients.

Sections:
- Sticky navbar with logo and links
- Hero section with big headline "Automate Your Business With AI"
- Features section with 3 cards showing AI automation features
- Testimonials section with 3 customer reviews
- Pricing section with Basic, Pro and Enterprise plans
- Contact form with name, email and message
- Footer with links and social icons

Add hover effects, smooth animations and responsive design for mobile and tablet.`);

  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [tab, setTab] = useState("preview");
  const [error, setError] = useState("");
  const [device, setDevice] = useState("desktop");
  const [copied, setCopied] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [fakeCode, setFakeCode] = useState("");

  const previewRef = useRef(null);

  const steps = [
    "Initializing AI builder...",
    "Designing modern layout...",
    "Generating HTML structure...",
    "Writing responsive CSS...",
    "Adding JavaScript interactivity...",
    "Optimizing mobile layout...",
    "Finalizing website..."
  ];

  const fakeCodeLines = [
    "<!DOCTYPE html>",
    "<html lang='en'>",
    "<head>",
    "  <meta charset='UTF-8'>",
    "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
    "  <title>AI Generated Website</title>",
    "</head>",
    "<body>",
    "  <header class='hero'>",
    "    <h1>Build Faster with AI</h1>",
    "    <p>Create beautiful websites instantly</p>",
    "  </header>",
    "  <section class='features'>",
    "    <div class='card'>Feature One</div>",
    "    <div class='card'>Feature Two</div>",
    "    <div class='card'>Feature Three</div>",
    "  </section>",
    "</body>",
    "</html>"
  ];

  useEffect(() => {
    if (!loading) {
      setFakeCode("");
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      setFakeCode((prev) => prev + fakeCodeLines[index] + "\n");
      index++;

      if (index >= fakeCodeLines.length) {
        clearInterval(interval);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgressStep((prev) => (prev + 1) % steps.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setHtml("");
    setCss("");
    setJs("");
    setProgressStep(0);

    try {
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();  // ← yeh try block ke ANDAR hona chahiye

      if (data.error) {
        setError(data.error);
        return;
      }

      setHtml(data.html || "");
      setCss(data.css || "");
      setJs(data.js || "");
      setTab("preview");

      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);

    } catch {
      setError("Failed to generate website.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code, type) => {
    await navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };
  const openFullScreen = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const deviceWidth =
    device === "mobile"
      ? "375px"
      : device === "tablet"
        ? "768px"
        : "100%";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e003a] via-[#2d0a4b] to-[#0a001a] flex flex-col items-center p-6">

      <div className="w-full max-w-4xl bg-black/60 rounded-2xl shadow-2xl p-8 border border-purple-800">

        <h1 className="text-3xl font-bold text-purple-400 text-center mb-6">
          AI Website Builder
        </h1>

        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 p-4 rounded-xl border border-purple-700 bg-zinc-900 text-white"
            placeholder="Edit the example prompt or describe your website..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={loading}
          />

          <button
            className="bg-purple-600 hover:bg-purple-700 px-6 rounded-xl disabled:opacity-50"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>


        {loading && (
          <div className="bg-zinc-900 border border-purple-800 rounded-xl p-6 mb-6">

            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
              <span className="text-purple-300 font-medium">
                AI is building your website...
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 ${index === progressStep
                    ? "text-purple-400"
                    : "opacity-50"
                    }`}
                >
                  {index < progressStep ? "✓" : "⚙"} {step}
                </div>
              ))}
            </div>

            <div className="mt-6 bg-black border border-purple-700 rounded-lg p-4 font-mono text-sm text-green-400 h-48 overflow-hidden">
              <pre className="whitespace-pre-wrap">
                {fakeCode}
              </pre>
            </div>

          </div>
        )}

        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}

        {(html || css || js) && (
          <div ref={previewRef}>

            <div className="flex gap-2 mb-2">
              {["preview", "html", "css", "js"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded text-white font-medium ${tab === t ? "bg-purple-600" : "bg-zinc-700 hover:bg-zinc-600"
                    }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-2">

              {tab !== "preview" && (
                <button
                  onClick={() =>
                    copyCode(
                      tab === "html"
                        ? html
                        : tab === "css"
                          ? css
                          : js,
                      tab
                    )
                  }
                  className="bg-purple-600 px-3 py-1 rounded text-sm"
                >
                  {copied === tab ? "Copied ✓" : "Copy"}
                </button>
              )}

              {tab === "preview" && (
                <>
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="bg-zinc-700 text-white px-2 py-1 rounded text-sm"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                  </select>

                  <button
                    onClick={openFullScreen}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    ⛶ Full Screen
                  </button>
                </>
              )}
            </div>

            <div className="bg-zinc-950 border border-purple-800 p-4 rounded h-[60vh] overflow-auto">

              {tab === "preview" && (
                <div style={{ width: deviceWidth }} className="mx-auto h-full transition-all duration-300">
                  <iframe
                    title="preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full bg-white rounded"
                    srcDoc={html}
                  />
                </div>
              )}

              {tab === "html" && (
                <pre className="text-green-400 text-sm">{html}</pre>
              )}

              {tab === "css" && (
                <pre className="text-blue-400 text-sm">{css}</pre>
              )}

              {tab === "js" && (
                <pre className="text-yellow-400 text-sm">{js}</pre>
              )}

            </div>

          </div>
        )}

      </div>

      <footer className="mt-6 text-purple-300 text-xs">
        Built with AI
      </footer>

    </main>
  );
}