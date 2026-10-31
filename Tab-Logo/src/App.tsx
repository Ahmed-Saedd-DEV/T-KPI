/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Download, 
  Copy, 
  Layers, 
  Eye, 
  Sliders, 
  Code2, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sparkles,
  Maximize2,
  ExternalLink
} from 'lucide-react';

// Exact path coordinates derived from geometric and boundary analysis of the original 803x810 image
const KEY_OUTER_PATH = `
  M 264 290
  L 524 247
  C 542 245 558 254 564 270
  L 568 296
  C 569 306 576 312 586 311
  L 616 312
  C 628 312 637 322 638 334
  L 622 470
  C 619 492 599 509 572 513
  L 236 551
  C 195 556 152 542 148 498
  L 182 334
  C 187 308 224 294 264 290 Z
`;

const KEY_INNER_PATH = `
  M 268 304
  L 516 263
  C 530 262 543 268 548 280
  L 552 305
  C 553 319 565 328 580 327
  L 606 328
  C 615 328 622 335 623 344
  L 608 459
  C 606 476 590 491 568 495
  L 245 531
  C 211 536 174 524 170 488
  L 198 343
  C 202 323 234 308 268 304 Z
`;

export default function App() {
  // Key state
  const [isPressed, setIsPressed] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Inspector & Comparison Controls
  const [activeTab, setActiveTab] = useState<'preview' | 'compare' | 'layers' | 'code'>('preview');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [compareMode, setCompareMode] = useState<'overlay' | 'side-by-side' | 'difference'>('overlay');

  // Customization controls
  const [blueColor, setBlueColor] = useState('#2b6bff');
  const [depthOffset, setDepthOffset] = useState(1); // 1 = 100% normal depth
  const [customScale, setCustomScale] = useState(1);
  const [copied, setCopied] = useState(false);

  // Visible layer toggles
  const [showBlueDepth, setShowBlueDepth] = useState(true);
  const [showWhiteFrame, setShowWhiteFrame] = useState(true);
  const [showDarkFace, setShowDarkFace] = useState(true);
  const [showTextAndArrow, setShowTextAndArrow] = useState(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Mechanical Keyboard Click Generator
  const playMechanicalClick = useCallback((pitch = 1) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Layer 1: Body 'thud' of key switch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(280 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(55 * pitch, now + 0.05);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);

      // Layer 2: Tactile click snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sine';
      snapOsc.frequency.setValueAtTime(1400 * pitch, now);
      snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

      snapGain.gain.setValueAtTime(0.18, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.03);
    } catch {
      // Audio playback fails silently if browser blocks
    }
  }, [soundEnabled]);

  // Press handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!isPressed) {
        setIsPressed(true);
        setPressCount(c => c + 1);
        playMechanicalClick(1.05);
      }
    }
  }, [isPressed, playMechanicalClick]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setIsPressed(false);
      playMechanicalClick(0.9);
    }
  }, [playMechanicalClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleMouseDown = () => {
    setIsPressed(true);
    setPressCount(c => c + 1);
    playMechanicalClick(1.05);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    playMechanicalClick(0.9);
  };

  // Generate SVG string for clipboard or download
  const generateSvgCode = useCallback(() => {
    // Generate fine-grained 36 extrusion slices along vector (36.5, 44.0)
    const steps = 36;
    let extrusionSvg = '';
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * depthOffset;
      const x = (t * 36.5).toFixed(1);
      const y = (t * 44.0).toFixed(1);
      extrusionSvg += `        <use href="#keycap-shape" x="${x}" y="${y}" />\n`;
    }

    return `<svg viewBox="0 0 803 810" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Keycap outer silhouette with rounded corners & top-right notch -->
    <path id="keycap-shape" d="${KEY_OUTER_PATH.trim().replace(/\s+/g, ' ')}" />
    <!-- Inset dark face silhouette -->
    <path id="keycap-inner" d="${KEY_INNER_PATH.trim().replace(/\s+/g, ' ')}" />
  </defs>

  <!-- LAYER 1: Blue 3D Depth Layer (${blueColor}) -->
  <g fill="${blueColor}">
${extrusionSvg}  </g>

  <!-- LAYER 2: White Border Frame (#ffffff) -->
  <use href="#keycap-shape" fill="#ffffff" />

  <!-- LAYER 3: Dark Face Layer (#111318) -->
  <use href="#keycap-inner" fill="#111318" />

  <!-- LAYER 4: "Tab" Text in Nunito Black Italic -->
  <text x="248" y="458"
        transform="rotate(-7.4 248 458)"
        font-family="'Nunito', sans-serif"
        font-weight="900"
        font-style="italic"
        font-size="106"
        letter-spacing="-1px"
        fill="#ffffff">Tab</text>

  <!-- LAYER 5: Custom White Arrow (→) -->
  <g stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <line x1="445" y1="410" x2="538" y2="398" />
    <polyline points="509 362, 540 398, 508 436" />
  </g>
</svg>`;
  }, [blueColor, depthOffset]);

  const copySvgToClipboard = () => {
    navigator.clipboard.writeText(generateSvgCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const downloadStandaloneHtml = () => {
    const a = document.createElement('a');
    a.href = '/tab-key-logo.html';
    a.download = 'tab-key-logo.html';
    a.click();
  };

  // Build extrusion steps for inline SVG
  const extrusionSteps = 36;
  const currentDepthFactor = isPressed ? 0.15 : depthOffset;
  const translationVector = isPressed ? { x: 18 * depthOffset, y: 22 * depthOffset } : { x: 0, y: 0 };

  return (
    <div className="min-h-screen w-full bg-[#0d0f14] text-slate-100 flex flex-col items-center justify-between overflow-x-hidden select-none font-sans">
      
      {/* Top Floating Control Bar */}
      <header className="w-full max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide text-white">Tab Key 3D Logo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-medium">SVG / CSS</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled 
                ? 'bg-slate-800/80 border-slate-700 text-blue-400 hover:bg-slate-700/80' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Click sound enabled' : 'Click sound muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl backdrop-blur-md shadow-md">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles size={14} />
            <span>Interactive</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye size={14} />
            <span>Compare Overlay</span>
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'layers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers size={14} />
            <span>Layers</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 size={14} />
            <span>SVG Code</span>
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copySvgToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-95"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied SVG!' : 'Copy SVG'}</span>
          </button>

          <button
            onClick={downloadStandaloneHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 shadow-blue-600/20"
          >
            <Download size={14} />
            <span>HTML File</span>
          </button>
        </div>
      </header>

      {/* Main Center Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* COMPARE TAB VIEW */}
        {activeTab === 'compare' && (
          <div className="absolute top-4 z-20 flex flex-wrap items-center justify-center gap-4 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mode:</span>
              <button
                onClick={() => setCompareMode('overlay')}
                className={`px-2.5 py-1 rounded-lg text-xs ${compareMode === 'overlay' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Overlay
              </button>
              <button
                onClick={() => setCompareMode('difference')}
                className={`px-2.5 py-1 rounded-lg text-xs ${compareMode === 'difference' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Difference
              </button>
              <button
                onClick={() => setCompareMode('side-by-side')}
                className={`px-2.5 py-1 rounded-lg text-xs ${compareMode === 'side-by-side' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Side-by-Side
              </button>
            </div>

            {compareMode !== 'side-by-side' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8 text-right">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* LAYERS TAB VIEW CONTROLS */}
        {activeTab === 'layers' && (
          <div className="absolute top-4 z-20 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl max-w-2xl">
            <label className="flex items-center gap-2 text-xs cursor-pointer px-2 py-1 rounded hover:bg-slate-800/60">
              <input
                type="checkbox"
                checked={showBlueDepth}
                onChange={(e) => setShowBlueDepth(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span className="text-blue-400 font-medium">1. Blue 3D Depth</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer px-2 py-1 rounded hover:bg-slate-800/60">
              <input
                type="checkbox"
                checked={showWhiteFrame}
                onChange={(e) => setShowWhiteFrame(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span className="text-white font-medium">2. White Frame</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer px-2 py-1 rounded hover:bg-slate-800/60">
              <input
                type="checkbox"
                checked={showDarkFace}
                onChange={(e) => setShowDarkFace(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span className="text-slate-400 font-medium">3. Dark Face</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer px-2 py-1 rounded hover:bg-slate-800/60">
              <input
                type="checkbox"
                checked={showTextAndArrow}
                onChange={(e) => setShowTextAndArrow(e.target.checked)}
                className="accent-blue-500 rounded"
              />
              <span className="text-emerald-400 font-medium">4. Tab & Arrow</span>
            </label>
          </div>
        )}

        {/* CODE TAB VIEW */}
        {activeTab === 'code' ? (
          <div className="w-full max-w-4xl max-h-[70vh] bg-slate-950/90 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col shadow-2xl backdrop-blur-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-blue-400" />
                <span className="text-xs font-mono text-slate-300">tab-key-logo.svg</span>
              </div>
              <button
                onClick={copySvgToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              {generateSvgCode()}
            </pre>
          </div>
        ) : compareMode === 'side-by-side' && activeTab === 'compare' ? (
          /* SIDE BY SIDE COMPARISON VIEW */
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center p-4">
            {/* Reference Image */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <span>Original Reference Image</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">803×810 PNG</span>
              </div>
              <div className="w-full max-w-[420px] aspect-[803/810] border border-slate-800 rounded-2xl overflow-hidden bg-[#070b12] shadow-2xl">
                <img 
                  src="/public/assets/aistudio/image_9e926db3.png" 
                  alt="Original Tab Key Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Our Recreated SVG */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                <span>Pixel-Perfect SVG Recreation</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">Vector</span>
              </div>
              <div className="w-full max-w-[420px] aspect-[803/810] border border-blue-500/30 rounded-2xl overflow-hidden bg-[#0d0f14] shadow-2xl flex items-center justify-center">
                <div 
                  className="w-full h-full cursor-pointer"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                >
                  {renderSvgLogo()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PRIMARY HERO LOGO VIEW (Centered, Filling Viewport) */
          <div className="relative flex items-center justify-center w-full max-w-4xl aspect-[803/810] max-h-[75vh]">
            
            {/* Underlay Reference Image if in Compare Mode */}
            {activeTab === 'compare' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <img
                  src="/public/assets/aistudio/image_9e926db3.png"
                  alt="Reference Tab Key"
                  className="w-full h-full object-contain"
                  style={{
                    opacity: 1 - overlayOpacity,
                    mixBlendMode: compareMode === 'difference' ? 'difference' : 'normal',
                  }}
                />
              </div>
            )}

            {/* The Interactive Key Container */}
            <div
              className={`w-full h-full flex items-center justify-center transition-transform duration-75 cursor-pointer z-10 ${
                isPressed ? 'scale-[0.98]' : 'hover:scale-[1.01]'
              }`}
              style={{
                transform: `scale(${customScale}) translate(${translationVector.x}px, ${translationVector.y}px)`,
                opacity: activeTab === 'compare' ? overlayOpacity : 1,
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => isPressed && setIsPressed(false)}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              title="Click or press Tab key on keyboard"
            >
              {renderSvgLogo()}
            </div>
          </div>
        )}

      </main>

      {/* Bottom Floating Status & Shortcut Footer */}
      <footer className="w-full max-w-4xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-white shadow-sm font-bold">
              Tab
            </kbd>
            <span>Press physical Tab key or click to type</span>
          </div>

          {pressCount > 0 && (
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
              Clicks: {pressCount}
            </span>
          )}
        </div>

        {/* Color Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-xs">Blue Depth:</span>
          <button
            onClick={() => setBlueColor('#2b6bff')}
            className={`w-4 h-4 rounded-full border transition-all ${
              blueColor === '#2b6bff' ? 'scale-125 border-white ring-2 ring-blue-500/40' : 'border-transparent'
            }`}
            style={{ backgroundColor: '#2b6bff' }}
            title="Electric Blue (#2b6bff)"
          />
          <button
            onClick={() => setBlueColor('#0169fd')}
            className={`w-4 h-4 rounded-full border transition-all ${
              blueColor === '#0169fd' ? 'scale-125 border-white ring-2 ring-blue-500/40' : 'border-transparent'
            }`}
            style={{ backgroundColor: '#0169fd' }}
            title="Deep Image Match Blue (#0169fd)"
          />
          <button
            onClick={() => setBlueColor('#3b82f6')}
            className={`w-4 h-4 rounded-full border transition-all ${
              blueColor === '#3b82f6' ? 'scale-125 border-white ring-2 ring-blue-500/40' : 'border-transparent'
            }`}
            style={{ backgroundColor: '#3b82f6' }}
            title="Sky Blue (#3b82f6)"
          />

          <div className="h-3 w-px bg-slate-800 mx-1" />

          {/* Standalone HTML link */}
          <a
            href="/tab-key-logo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Open pure self-contained HTML page"
          >
            <span>Clean HTML</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );

  // SVG Renderer with all layers and options
  function renderSvgLogo() {
    return (
      <svg 
        viewBox="0 0 803 810" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-2xl"
      >
        <defs>
          {/* Master Key Outer Silhouette */}
          <path id="svg-key-shape" d={KEY_OUTER_PATH} />
          {/* Inset Dark Face Silhouette */}
          <path id="svg-key-inner" d={KEY_INNER_PATH} />
        </defs>

        {/* LAYER 1: Blue 3D Extruded Depth */}
        {showBlueDepth && (
          <g 
            fill={blueColor}
            className="transition-opacity duration-75"
            style={{ opacity: isPressed ? 0.2 : 1 }}
          >
            {Array.from({ length: extrusionSteps }).map((_, i) => {
              const t = ((i + 1) / extrusionSteps) * currentDepthFactor;
              const x = (t * 36.5).toFixed(1);
              const y = (t * 44.0).toFixed(1);
              return <use key={i} href="#svg-key-shape" x={x} y={y} />;
            })}
          </g>
        )}

        {/* LAYER 2: White Border Frame */}
        {showWhiteFrame && (
          <use href="#svg-key-shape" fill="#ffffff" />
        )}

        {/* LAYER 3: Dark Face Layer */}
        {showDarkFace && (
          <use href="#svg-key-inner" fill="#111318" />
        )}

        {/* LAYER 4: Typography and Glyph */}
        {showTextAndArrow && (
          <>
            {/* "Tab" Text in Google Font Nunito 900 Black Italic */}
            <text
              x="248"
              y="458"
              transform="rotate(-7.4 248 458)"
              fontFamily="'Nunito', system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="106"
              letterSpacing="-1px"
              fill="#ffffff"
            >
              Tab
            </text>

            {/* Custom Thick Arrow (→) */}
            <g stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <line x1="445" y1="410" x2="538" y2="398" />
              <polyline points="509 362, 540 398, 508 436" />
            </g>
          </>
        )}
      </svg>
    );
  }
}
