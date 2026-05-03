import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Fade-in wrapper ─── */
function FadeIn({ children, delay = 0, direction = "up", style = {} }) {
  const [ref, inView] = useInView();
  const transforms = { up: "translateY(36px)", down: "translateY(-36px)", left: "translateX(-36px)", right: "translateX(36px)", none: "none" };
  return (
    <div ref={ref} style={{
      transform: inView ? "none" : transforms[direction],
      opacity: inView ? 1 : 0,
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      ...style
    }}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const FEATURES = [
    { name: "Agricultural Advisory", icon: "🌾", desc: "Expert crop and soil guidance powered by FarmLink AI for every Indian farmer.", color: "#EAF3DE" },
    { name: "Equipment Network",      icon: "🚜", desc: "A trusted marketplace connecting farmers and vendors for affordable equipment rental.", color: "#FEF3C7" },
    { name: "Market Intelligence",    icon: "📊", desc: "Real-time price forecasts and demand analysis to help farmers sell at the right time.", color: "#E0F2FE" },
    { name: "Weather Intelligence",   icon: "⛅", desc: "5-day farm-specific weather forecasts powered by OpenWeatherMap.", color: "#F0FDF4" },
  ];

  const TECH = [
    { name: "React 18",   icon: "⚛️",  desc: "Frontend SPA",  color: "#61DAFB" },
    { name: "Node.js",    icon: "🟩",  desc: "Backend API",   color: "#3C873A" },
    { name: "MongoDB",    icon: "🍃",  desc: "Database",      color: "#47A248" },
    { name: "Gemini AI",  icon: "✨",  desc: "AI Engine",     color: "#4285F4" },
    { name: "Razorpay",   icon: "💳",  desc: "Payments",      color: "#2B6CB0" },
    { name: "Cloudinary", icon: "☁️",  desc: "Media CDN",     color: "#3448C5" },
  ];

  const HOW_IT_WORKS = [
    { step: "01", title: "Register",       desc: "Sign up as a Farmer or Vendor. Vendors are reviewed and approved by admin before going live.", icon: "📝" },
    { step: "02", title: "List or Browse", desc: "Vendors list equipment. Renters browse, filter by location and type, and check live availability.", icon: "🔍" },
    { step: "03", title: "Book & Pay",     desc: "Renter submits a booking request. Owner confirms. Renter pays securely via Razorpay.", icon: "💳" },
    { step: "04", title: "Photo Proof",    desc: "Owner photographs before dispatch. Renter photographs on return. Both stored on Cloudinary.", icon: "📷" },
    { step: "05", title: "Complete",       desc: "Owner verifies returned condition and completes booking. Renter leaves a star rating.", icon: "✅" },
  ];

  const STATS = [
    { icon: "👨‍🌾", value: 12000, suffix: "+", label: "Farmers Registered" },
    { icon: "🚜", value: 3400, suffix: "+", label: "Equipment Listed" },
    { icon: "📦", value: 8500, suffix: "+", label: "Bookings Completed" },
    { icon: "🌐", value: 3,    suffix: "",  label: "Languages Supported" },
  ];

  const VALUES = [
    { icon: "🤝", title: "Trust",         desc: "Every transaction is protected with photo documentation, verified payments, and admin oversight." },
    { icon: "🌍", title: "Accessibility", desc: "Available in English, Hindi, and Marathi so every farmer can use FarmLink in their own language." },
    { icon: "💡", title: "Innovation",    desc: "Cutting-edge AI and cloud technology to bring large-farm tools to every small farmer." },
    { icon: "🌱", title: "Sustainability",desc: "By enabling equipment sharing, we reduce costs and carbon footprint across Indian agriculture." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .about-root { font-family: 'DM Sans', sans-serif; background: #FAFAF8; color: #1a1a1a; overflow-x: hidden; }

        /* ── HERO ── */
        .hero {
          position: relative;
          background: linear-gradient(135deg, #071205 0%, #1C3A0E 55%, #2d5a1a 100%);
          padding: 6rem 2rem 5rem;
          overflow: hidden;
          min-height: 90vh;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; opacity: 0.4;
        }
        .hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(151,196,89,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(59,109,17,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        /* Floating orbs */
        .orb { position: absolute; border-radius: 50%; pointer-events: none; animation: float 6s ease-in-out infinite; }
        .orb1 { width: 260px; height: 260px; right: 5%; top: 12%;  background: rgba(151,196,89,0.07); border: 1px solid rgba(151,196,89,0.18); animation-delay: 0s; }
        .orb2 { width: 120px; height: 120px; right: 18%; top: 55%; background: rgba(151,196,89,0.10); border: 1px solid rgba(151,196,89,0.22); animation-delay: 2s; }
        .orb3 { width: 60px;  height: 60px;  left: 8%;  top: 25%; background: rgba(151,196,89,0.08); border: 1px solid rgba(151,196,89,0.2); animation-delay: 4s; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }

        /* Wheat decorations */
        .wheat-decor { position: absolute; font-size: 80px; opacity: 0.06; pointer-events: none; animation: sway 8s ease-in-out infinite; }
        .wheat1 { left: 3%; bottom: 10%; animation-delay: 0s; }
        .wheat2 { right: 4%; bottom: 5%; animation-delay: 3s; font-size: 60px; }
        @keyframes sway { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }

        /* Grid lines bg */
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(151,196,89,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(151,196,89,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .hero-content { position: relative; z-index: 2; max-width: 720px; text-align: center; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(151,196,89,0.15); border: 0.5px solid rgba(151,196,89,0.4);
          border-radius: 30px; padding: 6px 16px; font-size: 12px; color: #97C459;
          margin-bottom: 24px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          animation: fadeDown 0.7s ease both;
        }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(36px, 6vw, 62px);
          color: white; line-height: 1.1;
          margin-bottom: 20px;
          animation: fadeDown 0.7s ease 0.15s both;
        }
        .hero-title span { color: #97C459; font-style: italic; }
        .hero-sub {
          font-size: clamp(14px, 2vw, 16px); color: rgba(255,255,255,0.68);
          line-height: 1.8; max-width: 560px; margin: 0 auto 36px;
          animation: fadeDown 0.7s ease 0.3s both;
        }
        .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; animation: fadeDown 0.7s ease 0.45s both; }
        .btn-primary {
          padding: 13px 30px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #4a8514, #3B6D11);
          color: white; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(59,109,17,0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(59,109,17,0.5); }
        .btn-outline {
          padding: 13px 30px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.06);
          color: white; font-size: 14px; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: background 0.2s, transform 0.2s;
          backdrop-filter: blur(4px);
        }
        .btn-outline:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }

        /* Scroll indicator */
        .scroll-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); animation: bounce 2s infinite; opacity: 0.5; }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }

        @keyframes fadeDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }

        /* ── STATS BAR ── */
        .stats-bar {
          background: white; border-bottom: 0.5px solid #E8E6E0;
          padding: 2rem; display: flex; justify-content: center;
          gap: clamp(1.5rem, 5vw, 4rem); flex-wrap: wrap;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .stat-item { text-align: center; }
        .stat-icon { font-size: 22px; margin-bottom: 4px; }
        .stat-value { font-size: clamp(22px, 4vw, 30px); font-weight: 700; color: #3B6D11; line-height: 1; font-family: 'DM Serif Display', serif; }
        .stat-label { font-size: 11px; color: #999; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .stat-divider { width: 1px; background: #E8E6E0; height: 40px; align-self: center; }
        @media(max-width:600px){ .stat-divider{display:none} }

        /* ── PAGE WRAPPER ── */
        .page { padding: 0 clamp(1rem, 5vw, 3rem) 5rem; max-width: 1100px; margin: 0 auto; }

        /* ── SECTION ── */
        .section { padding: 5rem 0 0; }
        .section-badge {
          display: inline-block; background: #EAF3DE; color: #27500A;
          font-size: 10px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
          margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.1em;
        }
        .section-title {
          font-family: 'DM Serif Display', serif; font-size: clamp(24px, 4vw, 32px);
          color: #1C3A0E; margin-bottom: 2.5rem; line-height: 1.3;
        }

        /* ── MISSION ── */
        .mission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        @media(max-width:768px){ .mission-grid{grid-template-columns:1fr} }
        .body-text { font-size: 14px; color: #666; line-height: 1.85; margin-bottom: 1rem; }
        .mission-cards { display: flex; flex-direction: column; gap: 14px; }
        .mission-card {
          background: #F7F6F3; border-radius: 16px; padding: 1.5rem;
          border: 0.5px solid #E8E6E0; transition: transform 0.3s, box-shadow 0.3s;
        }
        .mission-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .mission-card-dark { background: linear-gradient(135deg,#1C3A0E,#3B6D11); color: white; border-color: transparent; }
        .mission-card-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
        .mission-card-sub { font-size: 13px; color: #888; line-height: 1.6; }
        .mission-card-sub-light { color: rgba(255,255,255,0.72); }

        /* Illustration placeholder (farm scene) */
        .farm-illus {
          width: 100%; aspect-ratio: 16/9; border-radius: 18px; overflow: hidden;
          background: linear-gradient(160deg, #0a2006 0%, #1C3A0E 40%, #3B6D11 70%, #97C459 100%);
          position: relative; margin-bottom: 14px;
          box-shadow: 0 16px 48px rgba(28,58,14,0.3);
        }
        .farm-illus-inner { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
        .farm-illus-sky { position: absolute; top: 0; left: 0; right: 0; height: 45%; background: linear-gradient(180deg,#071c02,#1a4409); }
        .farm-stars { position: absolute; top: 8%; width: 100%; display: flex; justify-content: space-around; }
        .farm-star { width: 3px; height: 3px; background: white; border-radius: 50%; opacity: 0.6; animation: twinkle 2s infinite alternate; }
        @keyframes twinkle { from{opacity:0.2} to{opacity:1} }
        .farm-ground { position: absolute; bottom: 0; left: 0; right: 0; height: 55%; background: linear-gradient(180deg,#2d5a12,#1a3a08); }
        .farm-rows { position: absolute; bottom: 15%; left: 0; right: 0; display: flex; gap: 8px; padding: 0 16px; }
        .farm-row { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .crop { font-size: clamp(14px,2.5vw,20px); animation: grow 3s ease-in-out infinite alternate; }
        @keyframes grow { from{transform:scaleY(0.9) translateY(2px)} to{transform:scaleY(1.05) translateY(-2px)} }
        .sun { position: absolute; top: 10%; right: 12%; width: 40px; height: 40px; background: radial-gradient(circle,#FFD700,#FFA500); border-radius: 50%; box-shadow: 0 0 30px rgba(255,200,0,0.5); animation: pulse-sun 3s ease infinite; }
        @keyframes pulse-sun { 0%,100%{box-shadow:0 0 30px rgba(255,200,0,0.5)} 50%{box-shadow:0 0 50px rgba(255,200,0,0.8)} }
        .tractor { position: absolute; bottom: 30%; left: 10%; font-size: 28px; animation: drive 8s linear infinite; }
        @keyframes drive { from{transform:translateX(0)} to{transform:translateX(200px)} }

        /* ── FEATURES ── */
        .features-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        @media(max-width:560px){ .features-grid{grid-template-columns:1fr} }
        .feature-card {
          background: white; border-radius: 16px; border: 0.5px solid #E8E6E0;
          padding: 1.75rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: transform 0.3s, box-shadow 0.3s;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--card-color) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { font-size: 36px; margin-bottom: 14px; display: block; }
        .feature-name { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: #888; line-height: 1.65; }

        /* ── HOW IT WORKS ── */
        .steps-container { display: flex; flex-direction: column; gap: 0; }
        .step-row {
          display: grid; grid-template-columns: 60px 1fr;
          gap: 0 20px; position: relative;
        }
        .step-row:not(:last-child) .step-line { position: absolute; left: 29px; top: 52px; width: 2px; height: calc(100% - 10px); background: linear-gradient(180deg,#3B6D11,#97C459); }
        .step-dot-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
        .step-dot {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #3B6D11, #97C459);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(59,109,17,0.35);
          transition: transform 0.3s;
        }
        .step-card-inner {
          background: white; border-radius: 14px; border: 0.5px solid #E8E6E0;
          padding: 1.25rem 1.5rem; margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .step-card-inner:hover { transform: translateX(6px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .step-num { font-size: 10px; font-weight: 700; color: #97C459; letter-spacing: 0.08em; margin-bottom: 4px; }
        .step-title-text { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
        .step-desc-text { font-size: 13px; color: #888; line-height: 1.6; }

        /* ── TECH STACK ── */
        .tech-section { padding: 4rem 0 0; }
        .tech-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; }
        @media(max-width:768px){ .tech-grid{grid-template-columns:repeat(3,1fr)} }
        @media(max-width:400px){ .tech-grid{grid-template-columns:repeat(2,1fr)} }
        .tech-card {
          background: white; border-radius: 14px; border: 0.5px solid #E8E6E0;
          padding: 1.25rem 0.75rem; text-align: center;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .tech-card:hover { transform: translateY(-6px) rotate(-1deg); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
        .tech-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 10px;
          display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .tech-name { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px; }
        .tech-desc { font-size: 10px; color: #aaa; }

        /* ── VALUES ── */
        .values-section { padding: 5rem 0 0; }
        .values-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        @media(max-width:768px){ .values-grid{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:420px){ .values-grid{grid-template-columns:1fr} }
        .value-card {
          background: white; border-radius: 16px; border: 0.5px solid #E8E6E0;
          padding: 1.75rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          text-align: center; transition: transform 0.3s, box-shadow 0.3s;
        }
        .value-card:hover { transform: translateY(-6px); box-shadow: 0 16px 36px rgba(0,0,0,0.09); }
        .value-icon-wrap {
          width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 14px;
          background: #EAF3DE; display: flex; align-items: center; justify-content: center;
          font-size: 28px; transition: background 0.3s;
        }
        .value-card:hover .value-icon-wrap { background: #3B6D11; }
        .value-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
        .value-desc { font-size: 12px; color: #888; line-height: 1.65; }

        /* ── CTA ── */
        .cta-section {
          margin-top: 5rem;
          background: linear-gradient(135deg, #0d2107, #1C3A0E 40%, #3B6D11 100%);
          border-radius: 24px; padding: clamp(2rem,5vw,4rem) 2rem; text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-bg-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          background: rgba(151,196,89,0.08); border: 1px solid rgba(151,196,89,0.15);
        }
        .cta-bg-orb1 { width: 300px; height: 300px; left: -80px; top: -80px; }
        .cta-bg-orb2 { width: 200px; height: 200px; right: -40px; bottom: -40px; }
        .cta-content { position: relative; z-index: 1; max-width: 520px; margin: 0 auto; }
        .cta-title { font-family: 'DM Serif Display', serif; font-size: clamp(24px,4vw,34px); color: white; margin-bottom: 12px; }
        .cta-sub { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 2.25rem; line-height: 1.7; }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cta-btn-primary {
          padding: 13px 30px; border-radius: 12px; border: none;
          background: white; color: #3B6D11; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .cta-btn-outline {
          padding: 13px 30px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.06);
          color: white; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit;
          transition: background 0.2s, transform 0.2s; backdrop-filter: blur(4px);
        }
        .cta-btn-outline:hover { background: rgba(255,255,255,0.13); transform: translateY(-2px); }

        /* ── DIVIDER ── */
        .divider { height: 1px; background: linear-gradient(90deg,transparent,#E8E6E0 30%,#E8E6E0 70%,transparent); margin: 0; }
      `}</style>

      <div className="about-root">

        {/* ── HERO ── */}
        <div className="hero">
          <div className="hero-noise" />
          <div className="hero-glow" />
          <div className="hero-grid" />
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
          <div className="wheat-decor wheat1">🌾</div>
          <div className="wheat-decor wheat2">🌾</div>

          <div className="hero-content">
            <div className="hero-badge">🌱 India's Agricultural Platform</div>
            <h1 className="hero-title">
              Connecting farmers,<br /><span>growing together.</span>
            </h1>
            <p className="hero-sub">
              FarmLink is India's agricultural equipment rental marketplace — built to make quality machinery affordable and accessible for every farmer, everywhere.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate("/equipment")}>Browse Equipment →</button>
              <button className="btn-outline" onClick={() => navigate("/farmer-dashboard")}>Go to Dashboard</button>
            </div>
          </div>

          <div className="scroll-hint">
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <rect x="6" y="2" width="8" height="13" rx="4" stroke="rgba(151,196,89,0.6)" strokeWidth="1.5"/>
              <circle cx="10" cy="7" r="2" fill="rgba(151,196,89,0.8)"/>
              <path d="M4 19l6 4 6-4" stroke="rgba(151,196,89,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="stats-bar">
          {STATS.map((s, i) => (
            <>
              <div className="stat-item" key={i}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value"><Counter target={s.value} suffix={s.suffix} /></div>
                <div className="stat-label">{s.label}</div>
              </div>
              {i < STATS.length - 1 && <div className="stat-divider" key={`d${i}`} />}
            </>
          ))}
        </div>

        <div className="page">

          {/* ── MISSION ── */}
          <div className="section">
            <FadeIn>
              <span className="section-badge">Our Mission</span>
              <h2 className="section-title">Empowering Indian farmers<br />with technology</h2>
            </FadeIn>
            <div className="mission-grid">
              <FadeIn direction="left" delay={100}>
                <div>
                  <p className="body-text">India's agricultural sector employs over 50% of the workforce, yet small and marginal farmers struggle with one persistent challenge — access to quality machinery. Owning a tractor or harvester costs lakhs of rupees, putting modern farming tools out of reach for most.</p>
                  <p className="body-text">FarmLink was created to change that. We built a platform where farmers and vendors can list idle equipment for rental, and where any farmer can find, book, and pay for machinery — all from their phone, in their own language.</p>
                  <p className="body-text">We go beyond rental. Our AI Advisor gives personalised crop recommendations, detects plant diseases from photos, and forecasts market prices. Our weather page delivers farm-specific 5-day forecasts. Everything a modern Indian farmer needs, in one place.</p>
                </div>
              </FadeIn>
              <FadeIn direction="right" delay={200}>
                <div>
                  {/* Animated farm illustration */}
                  <div className="farm-illus">
                    <div className="farm-illus-sky" />
                    <div className="farm-stars">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="farm-star" style={{ animationDelay: `${i * 0.3}s` }} />
                      ))}
                    </div>
                    <div className="sun" />
                    <div className="farm-ground" />
                    <div className="farm-rows">
                      {["🌾","🌽","🌾","🌿","🌾","🌽","🌾","🌿"].map((c, i) => (
                        <div key={i} className="farm-row">
                          <div className="crop" style={{ animationDelay: `${i * 0.2}s` }}>{c}</div>
                          <div className="crop" style={{ animationDelay: `${i * 0.15 + 0.5}s`, fontSize:"12px" }}>{c}</div>
                        </div>
                      ))}
                    </div>
                    <div className="tractor">🚜</div>
                  </div>

                  <div className="mission-cards">
                    <div className="mission-card">
                      <div style={{ fontSize:"32px", marginBottom:"10px" }}>🤝</div>
                      <div className="mission-card-title">P2P Equipment Rental</div>
                      <div className="mission-card-sub">Any farmer can list their idle equipment and earn extra income — not just vendors.</div>
                    </div>
                    <div className="mission-card mission-card-dark">
                      <div style={{ fontSize:"32px", marginBottom:"10px" }}>🤖</div>
                      <div className="mission-card-title" style={{ color:"white" }}>AI-Powered Advice</div>
                      <div className="mission-card-sub mission-card-sub-light">FarmLink AI gives crop, disease, and market guidance in your language.</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          <div className="divider" style={{ marginTop:"4rem" }} />

          {/* ── FEATURES ── */}
          <div className="section">
            <FadeIn>
              <span className="section-badge">What We Offer</span>
              <h2 className="section-title">Everything a farmer needs</h2>
            </FadeIn>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <FadeIn key={i} delay={i * 100} direction="up">
                  <div className="feature-card" style={{ "--card-color": f.color }}>
                    <span className="feature-icon">{f.icon}</span>
                    <div className="feature-name">{f.name}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <div className="divider" style={{ marginTop:"4rem" }} />

          {/* ── HOW IT WORKS ── */}
          <div className="section">
            <FadeIn>
              <span className="section-badge">How It Works</span>
              <h2 className="section-title">From registration to completed rental</h2>
            </FadeIn>
            <div className="steps-container">
              {HOW_IT_WORKS.map((step, i) => (
                <FadeIn key={i} delay={i * 120} direction="left">
                  <div className="step-row">
                    <div className="step-dot-wrap">
                      <div className="step-dot">{step.icon}</div>
                      {i < HOW_IT_WORKS.length - 1 && <div className="step-line" />}
                    </div>
                    <div className="step-card-inner">
                      <div className="step-num">STEP {step.step}</div>
                      <div className="step-title-text">{step.title}</div>
                      <div className="step-desc-text">{step.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <div className="divider" style={{ marginTop:"4rem" }} />

          {/* ── TECH STACK ── */}
          <div className="tech-section">
            <FadeIn>
              <span className="section-badge">Tech Stack</span>
              <h2 className="section-title">Built with modern technology</h2>
            </FadeIn>
            <div className="tech-grid">
              {TECH.map((t, i) => (
                <FadeIn key={i} delay={i * 80} direction="up">
                  <div className="tech-card">
                    <div className="tech-icon-wrap" style={{ background: `${t.color}18` }}>
                      <span>{t.icon}</span>
                    </div>
                    <div className="tech-name">{t.name}</div>
                    <div className="tech-desc">{t.desc}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <div className="divider" style={{ marginTop:"4rem" }} />

          {/* ── VALUES ── */}
          <div className="values-section">
            <FadeIn style={{ textAlign:"center" }}>
              <span className="section-badge">Our Values</span>
              <h2 className="section-title" style={{ textAlign:"center" }}>What drives us</h2>
            </FadeIn>
            <div className="values-grid">
              {VALUES.map((v, i) => (
                <FadeIn key={i} delay={i * 100} direction="up">
                  <div className="value-card">
                    <div className="value-icon-wrap">{v.icon}</div>
                    <div className="value-title">{v.title}</div>
                    <div className="value-desc">{v.desc}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <FadeIn delay={100}>
            <div className="cta-section">
              <div className="cta-bg-orb cta-bg-orb1" />
              <div className="cta-bg-orb cta-bg-orb2" />
              <div className="cta-content">
                <h2 className="cta-title">Ready to get started?</h2>
                <p className="cta-sub">Join thousands of farmers and vendors already using FarmLink to rent smarter and farm better.</p>
                <div className="cta-btns">
                  <button className="cta-btn-primary" onClick={() => navigate("/equipment")}>Browse Equipment</button>
                  <button className="cta-btn-outline" onClick={() => navigate("/farmer-dashboard")}>Go to Dashboard</button>
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </div>
    </>
  );
}