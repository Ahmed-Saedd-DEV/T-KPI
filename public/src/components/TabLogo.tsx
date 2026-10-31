import React, { useCallback, useEffect, useRef, useState } from "react";

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

const extrusionSteps = 36;
const blueDepth = "#2b6bff";

export const TabLogo: React.FC = () => {
  const [isPressed, setIsPressed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pressedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mediaQuery.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };

    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
      }
    };
  }, []);

  const playMechanicalClick = useCallback((pitch = 1) => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }

      const ctx = audioCtxRef.current;
      if (!ctx) {
        return;
      }

      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const now = ctx.currentTime;

      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = "triangle";
      bodyOsc.frequency.setValueAtTime(280 * pitch, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(55 * pitch, now + 0.05);
      bodyGain.gain.setValueAtTime(0.35, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.06);

      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = "sine";
      snapOsc.frequency.setValueAtTime(1400 * pitch, now);
      snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);
      snapGain.gain.setValueAtTime(0.18, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.03);
    } catch {
      // Browsers may block or restrict audio; fail silently without crashing UI.
    }
  }, []);

  const press = useCallback(() => {
    if (pressedRef.current) {
      return;
    }

    pressedRef.current = true;
    setIsPressed(true);
    playMechanicalClick(1.05);
  }, [playMechanicalClick]);

  const release = useCallback(() => {
    if (!pressedRef.current) {
      return;
    }

    pressedRef.current = false;
    setIsPressed(false);
    playMechanicalClick(0.9);
  }, [playMechanicalClick]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      press();
    },
    [press],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      release();
    },
    [release],
  );

  const handleButtonKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "Tab" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        press();
      }
    },
    [press],
  );

  const handleButtonKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Tab" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        release();
      }
    },
    [release],
  );

  const currentDepthFactor = isPressed ? 0.15 : 1;
  const wrapperTransform = reducedMotionRef.current
    ? isPressed
      ? "scale(0.98)"
      : "scale(1)"
    : isPressed
      ? "scale(0.98) translate(10px, 12px)"
      : "scale(1) translate(0px, 0px)";

  return (
    <button
      type="button"
      aria-label="Tab key logo"
      aria-pressed={isPressed}
      data-pressed={String(isPressed)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleButtonKeyDown}
      onKeyUp={handleButtonKeyUp}
      className="group relative flex w-[90%] max-w-[240px] items-center justify-center overflow-visible bg-transparent p-0 border-0 rounded-none shadow-none transition-transform duration-75 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]"
      style={{
        touchAction: "manipulation",
        transform: wrapperTransform,
      }}
    >
      <svg
        viewBox="120 170 560 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <path id="tab-key-shape" d={KEY_OUTER_PATH} />
          <path id="tab-key-inner" d={KEY_INNER_PATH} />
        </defs>

        <g fill={blueDepth} style={{ opacity: isPressed ? 0.2 : 1 }}>
          {Array.from({ length: extrusionSteps }).map((_, index) => {
            const t = ((index + 1) / extrusionSteps) * currentDepthFactor;
            const x = (t * 36.5).toFixed(1);
            const y = (t * 44.0).toFixed(1);
            return <use key={index} href="#tab-key-shape" x={x} y={y} />;
          })}
        </g>

        <use href="#tab-key-shape" fill="#ffffff" />
        <use href="#tab-key-inner" fill="#111318" />

        <text
          x="248"
          y="458"
          transform="rotate(-7.4 248 458)"
          fontFamily="'Nunito', 'Segoe UI', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="106"
          letterSpacing="-1px"
          fill="#ffffff"
        >
          Tab
        </text>

        <g
          stroke="#ffffff"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="445" y1="410" x2="538" y2="398" />
          <polyline points="509 362, 540 398, 508 436" />
        </g>
      </svg>
    </button>
  );
};
