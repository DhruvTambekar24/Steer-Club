"use client";

import { useEffect, useRef, useState } from "react";

const scenes = [
  {
    time: "7am",
    title: "Chai, before the day begins",
    copy: "Chai and biscuits can bring a quick rise. What happens next depends on the whole meal and the person.",
    image: "/manus-storage/async-images/XN9IeOPB1gAPKFwEHxOOhU/image-1.webp",
    alt: "Hand-drawn glass of chai and a small plate of biscuits",
  },
  {
    time: "1pm",
    title: "Lunch, with a little balance",
    copy: "Roti, sabzi and dal sit together on the plate. A meal is more than one ingredient.",
    image: "/manus-storage/async-images/XN9IeOPB1gAPKFwEHxOOhU/image-2.webp",
    alt: "Hand-drawn Indian thali with roti, dal and sabzi",
  },
  {
    time: "4pm",
    title: "The afternoon dip",
    copy: "Sleep, meals and the day around you all play a part. Hunger is a signal, not a character flaw.",
    image: "/manus-storage/async-images/XN9IeOPB1gAPKFwEHxOOhU/image-3.webp",
    alt: "Hand-drawn desk with a tiffin, chai glass and desk lamp",
  },
  {
    time: "8pm",
    title: "Dinner, without a moral score",
    copy: "There is no perfect plate here. A steady pattern that fits your life can matter more than one meal.",
    image: "/manus-storage/async-images/XN9IeOPB1gAPKFwEHxOOhU/image-4.webp",
    alt: "Hand-drawn Indian dinner of dal, sabzi and roti",
  },
  {
    time: "after dinner",
    title: "A small walk counts",
    copy: "A gentle ten-minute walk may soften the after-meal rise for some people. It is an option, not a test.",
    image: "/manus-storage/async-images/XN9IeOPB1gAPKFwEHxOOhU/image-5.webp",
    alt: "Hand-drawn pair of walking shoes beside a doorway",
  },
];

export default function MetabolismStory() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const curveRef = useRef<SVGPathElement>(null);
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    if (!rootRef.current || !stageRef.current || !curveRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let frameId = 0;
    let lenis: { raf: (time: number) => void; destroy: () => void } | undefined;
    let context: { revert: () => void } | undefined;

    async function setupStoryMotion() {
      const [gsapModule, triggerModule, LenisModule] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled || !rootRef.current || !stageRef.current || !curveRef.current) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const Lenis = LenisModule.default;
      const smoother = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
      lenis = smoother;
      smoother.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => {
        smoother.raf(time);
        frameId = window.requestAnimationFrame(raf);
      };
      frameId = window.requestAnimationFrame(raf);

      const path = curveRef.current;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      context = gsap.context(() => {
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "+=1900",
            pin: stageRef.current,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const nextScene = Math.min(scenes.length - 1, Math.floor(self.progress * scenes.length));
              setSceneIndex((current) => (current === nextScene ? current : nextScene));
            },
          },
        });
      }, rootRef.current);
      ScrollTrigger.refresh();
    }

    void setupStoryMotion();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      context?.revert();
      lenis?.destroy();
    };
  }, []);

  const active = scenes[sceneIndex];

  return (
    <>
      <section className="story-intro section-pad" aria-labelledby="day-story-title">
        <p className="section-kicker"><span className="kicker-rule" /> a day inside your metabolism</p>
        <h2 className="section-heading" id="day-story-title">Small moments, <em>not a perfect day.</em></h2>
        <p className="section-copy">A little sketch of the rhythms around meals, energy and movement. Your body is more than this line.</p>
      </section>
      <section ref={rootRef} className="story-scroller" aria-label="A day inside your metabolism, illustrated">
        <div ref={stageRef} className="story-stage">
          <div className="story-stage-header">
            <p className="section-kicker"><span className="kicker-rule" /> one day, many signals</p>
            <span className="illustration-label">illustration,<br />not data</span>
          </div>
          <p className="story-time" aria-live="polite">{active.time}</p>
          <h3 className="story-title">{active.title}</h3>
          <p className="story-copy">{sceneIndex === 2 ? <><em>“this is the 4pm hunger. not weak willpower.”</em> {active.copy}</> : active.copy}</p>
          <div className="story-art-wrap" key={active.image}>
            <img className="story-art" src={active.image} alt={active.alt} loading="lazy" decoding="async" />
          </div>
          <div className="story-curve-wrap" aria-label="Illustrative blood-sugar curve, not measured data">
            <svg className="story-curve" viewBox="0 0 432 160" preserveAspectRatio="none" aria-hidden="true">
              <path className="curve-track" d="M 2 124 C 42 126, 62 116, 86 112 S 127 108, 146 114 S 179 122, 201 120 S 230 127, 252 132 S 287 134, 309 125 S 343 115, 365 118 S 397 125, 430 121" />
              <path ref={curveRef} className="curve-line" d="M 2 124 C 42 126, 62 44, 86 47 S 127 103, 146 114 S 179 72, 201 72 S 230 127, 252 132 S 287 134, 309 125 S 343 82, 365 86 S 397 125, 430 121" />
            </svg>
            <div className="story-ticks" aria-hidden="true"><span>morning</span><span>lunch</span><span>afternoon</span><span>evening</span></div>
          </div>
          <div className="story-progress" aria-hidden="true">{scenes.map((scene, index) => <span key={scene.time} className={index <= sceneIndex ? "is-active" : ""} />)}</div>
          {sceneIndex === 2 && <span className="story-hand-note" aria-hidden="true">not weak willpower</span>}
        </div>
        <ol className="story-reduced-list" aria-label="Five moments in the day">
          {scenes.map((scene) => (
            <li key={scene.time}>
              <p className="story-time">{scene.time}</p>
              <h3 className="story-title">{scene.title}</h3>
              <p className="story-copy">{scene.copy}</p>
              <img src={scene.image} alt={scene.alt} loading="lazy" decoding="async" />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
