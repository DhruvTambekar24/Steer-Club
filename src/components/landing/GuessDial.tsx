"use client";

import { useRef } from "react";

interface GuessDialProps {
  value: number;
  onChange: (value: number) => void;
  locked: boolean;
}

export default function GuessDial({ value, onChange, locked }: GuessDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lastTickRef = useRef(Math.floor(value / 10));
  const circumference = 2 * Math.PI * 104;

  function commit(nextValue: number) {
    if (locked) return;
    const next = Math.min(100, Math.max(0, Math.round(nextValue)));
    const nextTick = Math.floor(next / 10);
    if (nextTick !== lastTickRef.current) {
      lastTickRef.current = nextTick;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(8);
      }
    }
    onChange(next);
  }

  function handlePointer(event: React.PointerEvent<SVGSVGElement>) {
    if (locked || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const degrees = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
    const percent = ((degrees + 450) % 360) / 3.6;
    commit(percent);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (locked) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      commit(value + step);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      commit(value - step);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(0);
    } else if (event.key === "End") {
      event.preventDefault();
      commit(100);
    }
  }

  const dashOffset = circumference * (1 - value / 100);

  return (
    <div
      className="dial-wrap"
      role="slider"
      aria-label="Your guess: how much of metabolic health is in your control?"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} percent guessed`}
      aria-readonly={locked}
      aria-describedby="dial-help"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <svg
        ref={svgRef}
        className="dial-svg"
        viewBox="0 0 232 232"
        role="presentation"
        onPointerDown={(event) => {
          if (locked) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          handlePointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons > 0) handlePointer(event);
        }}
      >
        <circle className="dial-inner-ring" cx="116" cy="116" r="87" />
        <circle className="dial-track" cx="116" cy="116" r="104" />
        <circle
          className="dial-progress"
          cx="116"
          cy="116"
          r="104"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <circle className="dial-hit" cx="116" cy="116" r="104" />
      </svg>
      <div className="dial-center" aria-hidden="true">
        <span className="dial-number" key={value}>
          {value}<small>%</small>
        </span>
        <span className="dial-caption">your first read</span>
      </div>
      {!locked && <span className="dial-annotation">drag. no sign-up, ever.</span>}
      {locked && <span className="dial-annotation">just a starting point.</span>}
    </div>
  );
}
