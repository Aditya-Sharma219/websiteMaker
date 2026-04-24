"use client";
import { useState, useRef, useEffect } from "react";
import { 
  Wand2, LayoutTemplate, Palette, MonitorPlay, Smartphone, 
  Tablet, Code, Download, History, Loader2, Sparkles, AlertCircle, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THEMES = [
  { id: "dark-futuristic", label: "Dark Futuristic", desc: "Neon, glowing, cyberpunk" },
  { id: "minimal-light", label: "Minimal Light", desc: "Clean, whitespace, elegant" },
  { id: "corporate", label: "Corporate Modern", desc: "Blue accents, professional, trustworthy" },
  { id: "playful", label: "Playful & Vibrant", desc: "Rounded shapes, bright colors, fun" }
];

const LAYOUTS = [
  { id: "landing", label: "SaaS Landing Page" },
  { id: "portfolio", label: "Personal Portfolio" },
  { id: "blog", label: "Blog / Magazine" }
];

const LOADING_STEPS = [
  "Initializing AI Engine...",
  "Analyzing requirements...",
  "Designing layout structure...",
  "Drafting copy & content...",
  "Writing HTML elements...",
  "Applying CSS styling...",
  "Adding JavaScript interactivity...",
  "Finalizing response..."
];

export default function WebsiteMaker() {
  const [prompt, setPrompt] = useState(`Create a modern AI SaaS startup landing page called "NeuroFlow".\nUse a dark futuristic theme with purple and blue gradients.\nSections:\n- Sticky navbar with logo and links\n- Hero section with big headline "Automate Your Business With AI"\n- Features section with 3 cards showing AI automation features\n- Testimonials section with 3 customer reviews\n- Pricing section with Basic, Pro and Enterprise plans\n- Contact form with name, email and message\n- Footer with links and social icons\nAdd hover effects, smooth animations and responsive design for mobile and tablet.`);
  const [theme, setTheme] = useState(THEMES[0].id);
  const [layout, setLayout] = useState(LAYOUTS[0].id);
  
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  
  const [viewMode, setViewMode] = useState("preview"); // preview, code
  const [device, setDevice] = useState("desktop"); // desktop, tablet, mobile
  const [copied, setCopied] = useState(false);
  
  const [history, setHistory] = useState([]);
  
  const previewContainerRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("website_maker_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // Sync loading steps
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError("");
    setWarning("");
    setProgressStep(0);
    
    // Construct real prompt behind the scenes
    const themeObj = THEMES.find(t => t.id === theme);
    const layoutObj = LAYOUTS.find(l => l.id === layout);
    
    const finalPrompt = `
You are building a ${layoutObj.label}.
The aesthetic should be: ${themeObj.label} (${themeObj.desc}).
Core user request: ${prompt}

Make sure to apply the requested theme and layout meticulously.
    `.trim();

    try {
      const res = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (data.finishReason === 'MAX_TOKENS') {
        setWarning("Generation ended prematurely due to low tokens. The website may be incomplete.");
      }
      
      const newSite = {
        id: Date.now().toString(),
        prompt,
        theme,
        layout,
        html: data.html || "",
        css: data.css || "",
        js: data.js || "",
        date: new Date().toISOString()
      };
      
      setHtml(newSite.html);
      setCss(newSite.css);
      setJs(newSite.js);
      setViewMode("preview");
      
      const newHistory = [newSite, ...history].slice(0, 5); // Keep last 5
      setHistory(newHistory);
      localStorage.setItem("website_maker_history", JSON.stringify(newHistory));
      
    } catch (err) {
      setError("Failed to generate website.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = (item) => {
    setPrompt(item.prompt);
    setTheme(item.theme);
    setLayout(item.layout);
    setHtml(item.html);
    setCss(item.css);
    setJs(item.js);
    setViewMode("preview");
  };

  const downloadCode = () => {
    if (!html) return;
    
    // Construct single HTML file
    let finalHtml = html;
    
    // Inject CSS if missing from HTML (API tries to put it in head, but we have separated them)
    if (css && !finalHtml.includes("<style>")) {
      finalHtml = finalHtml.replace("</head>", `\n<style>\n${css}\n</style>\n</head>`);
    } else if (css && finalHtml.includes("<style>")) {
      // It normally comes embedded and is just extracted by backend, so usually we just need to spit out original HTML which has it embedded.
      // Since backend route.js actually just extracts them but leaves the original html string alone (Wait, route.js returns `html` which holds the FULL html including embedded CSS/JS).
      // So downloading `html` directly is usually complete!
    }
    
    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-site-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const copyToClipboard = () => {
    let fullCode = html;
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deviceWidth = device === "mobile" ? "375px" : device === "tablet" ? "768px" : "100%";

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR - Config */}
      <div className="w-[380px] flex-shrink-0 bg-[#0a0a0b] border-r border-gray-800/60 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-gray-800/60 flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">NeuroBuilder AI</h1>
            <p className="text-xs text-gray-500">v2.0 • Max 8192 Tokens</p>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-8">
          
          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
              <Wand2 size={16} className="text-purple-400" /> Let's build your site
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your startup, business, or portfolio idea in detail..."
              className="w-full h-32 bg-[#111] border border-gray-800 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder-gray-600"
            />
          </div>

          {/* Settings Grids */}
          <div className="space-y-6">
            <div className="space-y-3">
               <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <LayoutTemplate size={16} className="text-emerald-400" /> Structure Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {LAYOUTS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLayout(l.id)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      layout === l.id 
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300" 
                      : "bg-[#111] border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
               <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
                <Palette size={16} className="text-pink-400" /> Aesthetic Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`text-left px-4 py-3 rounded-xl border text-xs transition-all ${
                      theme === t.id 
                      ? "bg-pink-500/10 border-pink-500/50 text-pink-300" 
                      : "bg-[#111] border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="font-semibold mb-1">{t.label}</div>
                    <div className="text-[10px] opacity-70 line-clamp-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Gathering AI Power...</>
                ) : (
                  <><Sparkles size={18} /> Generate Website</>
                )}
              </span>
            </button>
            {error && (
               <div className="mt-3 flex items-start gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {warning && (
               <div className="mt-3 flex items-start gap-2 text-yellow-400 text-xs bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{warning}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col bg-[#050505] relative isolate">
        
        {/* Top toolbar */}
        <header className="h-16 border-b border-gray-800/60 bg-[#0a0a0b]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 w-full sticky top-0">
          
          {/* View Toggles */}
          <div className="flex p-1 bg-[#111] rounded-lg border border-gray-800">
            <button 
              onClick={() => setViewMode("preview")}
              className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${viewMode === "preview" ? "bg-gray-800 text-white shadow" : "text-gray-400 hover:text-white"}`}
            >
              <LayoutTemplate size={16} /> Preview
            </button>
            <button 
              onClick={() => setViewMode("code")}
              className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${viewMode === "code" ? "bg-gray-800 text-white shadow" : "text-gray-400 hover:text-white"}`}
            >
              <Code size={16} /> Code Code
            </button>
            <button 
              onClick={() => setViewMode("history")}
              className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${viewMode === "history" ? "bg-gray-800 text-white shadow" : "text-gray-400 hover:text-white"}`}
            >
              <History size={16} /> History
            </button>
          </div>

          {/* Device Toggles & Actions */}
          <div className="flex items-center gap-4">
            {viewMode === "preview" && html && (
              <div className="flex items-center gap-1 bg-[#111] border border-gray-800 rounded-lg p-1">
                {[
                  { id: "desktop", icon: <MonitorPlay size={16} /> },
                  { id: "tablet", icon: <Tablet size={16} /> },
                  { id: "mobile", icon: <Smartphone size={16} /> }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={`p-1.5 rounded-md transition-colors ${device === d.id ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800"}`}
                  >
                    {d.icon}
                  </button>
                ))}
              </div>
            )}

            {html && (
              <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-[#111] hover:bg-gray-800 border border-gray-800 px-3 py-1.5 rounded-lg"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button 
                  onClick={downloadCode}
                  className="flex items-center gap-2 text-sm text-blue-100 bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-lg shadow-lg shadow-blue-900/20"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-[#050505]">
          
          {loading && (
            <div className="absolute inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0a0b] border border-gray-800/80 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center"
              >
                <div className="relative mb-8">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" />
                </div>
                
                <h3 className="text-xl text-white font-semibold tracking-tight mb-2">Building your vision</h3>
                
                <div className="w-full space-y-3 mt-4">
                  {LOADING_STEPS.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`text-sm flex items-center gap-3 transition-opacity duration-300 ${
                        idx === progressStep ? "text-blue-400 font-medium scale-105 origin-left" : 
                        idx < progressStep ? "text-gray-500" : "text-gray-700 hidden"
                      }`}
                    >
                      {idx < progressStep ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : idx === progressStep ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-700" />
                      )}
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {!html && !loading && viewMode !== "history" && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
               <div className="w-24 h-24 mb-6 rounded-3xl bg-gray-900/50 border border-gray-800 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                  <Wand2 size={40} className="text-gray-600" />
               </div>
               <h2 className="text-xl font-medium text-gray-300 mb-2">Workspace is empty</h2>
               <p className="text-sm max-w-sm text-center">Fill out the prompt panel on the left and hit Generate to watch the AI build your site.</p>
             </div>
          )}

          <AnimatePresence mode="wait">
            {html && viewMode === "preview" && !loading && (
               <motion.div 
                 key="preview"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="w-full h-full overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar"
                 ref={previewContainerRef}
               >
                 <div 
                   style={{ width: deviceWidth }} 
                   className="bg-white rounded-xl shadow-2xl shadow-blue-900/5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] h-full border border-gray-800 overflow-hidden flex flex-col relative"
                 >
                    {/* Fake Browser Top */}
                    <div className="h-10 bg-gray-100 flex items-center px-4 gap-2 border-b border-gray-200">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="mx-auto px-4 py-1 bg-white rounded-md text-[10px] text-gray-400 font-mono flex-1 max-w-[200px] text-center border border-gray-200 shadow-sm truncate">
                        preview.neurobuilder.ai
                      </div>
                    </div>
                    {/* IFrame Area */}
                    <iframe
                      title="preview window"
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full flex-1 bg-white"
                      srcDoc={html}
                    />
                 </div>
               </motion.div>
            )}

            {html && viewMode === "code" && !loading && (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full p-6 overflow-hidden"
              >
                <div className="w-full h-full bg-[#0a0a0b] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl text-left">
                  <div className="bg-[#111] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono tracking-wide">
                      <Code size={16} /> index.html
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <pre className="text-sm font-mono leading-relaxed text-gray-300">
                      <code dangerouslySetInnerHTML={{ __html: html.replace(/</g, "&lt;").replace(/>/g, "&gt;") }} />
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === "history" && !loading && (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-y-auto p-8 custom-scrollbar"
              >
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <History className="text-blue-500" /> Version History
                  </h2>
                  
                  {history.length === 0 ? (
                    <div className="p-12 text-center border border-gray-800 border-dashed rounded-2xl bg-[#0a0a0b]">
                      <p className="text-gray-500">No generated sites found in history.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((item, idx) => (
                        <div key={item.id} className="bg-[#0a0a0b] border border-gray-800 p-5 rounded-xl hover:border-gray-600 transition-colors group">
                           <div className="flex justify-between items-start mb-3">
                             <div>
                               <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-medium">Attempt #{history.length - idx}</span>
                               <span className="text-xs text-gray-500 ml-2">{new Date(item.date).toLocaleString()}</span>
                             </div>
                             <button
                               onClick={() => loadHistory(item)}
                               className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                             >
                               Restore
                             </button>
                           </div>
                           <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                             "{item.prompt}"
                           </p>
                           <div className="flex gap-2">
                             <span className="text-[10px] uppercase tracking-wider text-pink-400 bg-pink-400/10 border border-pink-400/20 px-2 py-0.5 rounded">
                               {THEMES.find(t => t.id === item.theme)?.label || item.theme}
                             </span>
                             <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                               {LAYOUTS.find(t => t.id === item.layout)?.label || item.layout}
                             </span>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}