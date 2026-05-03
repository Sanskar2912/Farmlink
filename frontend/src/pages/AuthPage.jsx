import { useState } from "react";
import { useAuth } from "../components/AuthContext";

const FARM_IMAGES = [
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=80",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=700&q=80",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=700&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&q=80",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&q=80",
];

// Right panel bg — lush green paddy field
const RIGHT_BG = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=85";

const ROLES = [
  {
    id: "farmer", label: "Farmer", desc: "Browse & rent equipment, get AI crop advice",
    icon: (<svg viewBox="0 0 32 32" fill="none" width="26" height="26"><path d="M16 4C16 4 8 10 8 18a8 8 0 0016 0c0-8-8-14-8-14z" fill="currentColor" opacity=".2"/><path d="M16 4C16 4 8 10 8 18a8 8 0 0016 0c0-8-8-14-8-14z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="16" y1="18" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="22" x2="16" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    color: "#3B6D11", bg: "#EAF3DE", border: "#97C459",
  },
  {
    id: "vendor", label: "Vendor", desc: "List equipment, manage bookings & revenue",
    icon: (<svg viewBox="0 0 32 32" fill="none" width="26" height="26"><rect x="4" y="14" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 14l4-8h16l4 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><rect x="12" y="18" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M10 14v4M16 14v4M22 14v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    color: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5",
  },
];

function Field({ id, label, type = "text", placeholder, error, value, onChange }) {
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      <label htmlFor={id} style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.75)", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>
      <input
        id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        autoComplete={type === "password" ? "current-password" : "off"}
        style={{
          width:"100%", padding:"11px 14px", borderRadius:"10px",
          border: error ? "1.5px solid #ff6b6b" : "1px solid rgba(255,255,255,0.2)",
          fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box",
          background:"rgba(255,255,255,0.12)", color:"white",
          backdropFilter:"blur(4px)", transition:"border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = "rgba(151,196,89,0.8)"}
        onBlur={e => e.target.style.borderColor = error ? "#ff6b6b" : "rgba(255,255,255,0.2)"}
      />
      {error && <div style={{ fontSize:"11px", color:"#ff9999", marginTop:"4px" }}>{error}</div>}
    </div>
  );
}

export default function AuthPage({ onAuth }) {
  const { login } = useAuth();
  const [mode, setMode]               = useState("login");
  const [role, setRole]               = useState("farmer");
  const [form, setForm]               = useState({ name:"", email:"", phone:"", password:"", confirm:"" });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = (id, val) => { setForm(f=>({...f,[id]:val})); setFieldErrors(f=>({...f,[id]:""})); };

  const validate = () => {
    const errs = {};
    if (mode === "register") {
      if (!form.name.trim()) errs.name = "Name is required";
      if (!form.phone.match(/^[6-9]\d{9}$/)) errs.phone = "Valid 10-digit number required";
      if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    }
    if (!form.email.match(/^\S+@\S+\.\S+$/)) errs.email = "Enter a valid email";
    if (form.password.length < 6) errs.password = "Minimum 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, phone: form.phone, password: form.password, role };
      const res  = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      login(data.user, data.token);
      onAuth?.(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(""); setFieldErrors({}); };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", position:"relative" }}>
      <style>{`
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);} }
        @keyframes kenBurns   { 0%{transform:scale(1);}100%{transform:scale(1.07);} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);} }
        @keyframes formIn     { from{opacity:0;transform:translateY(16px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }

        .auth-tile img        { animation: kenBurns 9s ease-in-out infinite alternate; }
        .auth-tile:nth-child(2) img { animation-delay:-3s; animation-direction:alternate-reverse; }
        .auth-tile:nth-child(3) img { animation-delay:-5s; }
        .auth-tile:nth-child(4) img { animation-delay:-1.5s; animation-direction:alternate-reverse; }
        .auth-tile:nth-child(5) img { animation-delay:-4s; }
        .auth-tile:nth-child(6) img { animation-delay:-6s; animation-direction:alternate-reverse; }
        .auth-tile { overflow:hidden; }

        .auth-input::placeholder { color: rgba(255,255,255,0.4); }
        .auth-input:focus        { border-color: rgba(151,196,89,0.8) !important; background: rgba(255,255,255,0.18) !important; }

        .auth-submit { transition: all 0.2s ease; }
        .auth-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.35); }

        .auth-mode-pill { transition: all 0.2s ease; }
        .auth-mode-pill.active { background: rgba(255,255,255,0.2) !important; color: white !important; }

        .auth-role-card { transition: all 0.2s ease; cursor:pointer; }
        .auth-role-card:hover { transform: translateY(-2px); }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .auth-left   { display: none !important; }
          .auth-right  {
            width: 100% !important;
            min-height: 100vh;
          }
          .auth-right-bg {
            background-attachment: scroll !important;
          }
          .auth-form-box {
            padding: 1.75rem 1.25rem !important;
            margin: 1rem !important;
            max-width: 100% !important;
            border-radius: 16px !important;
          }
          .auth-mobile-logo {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>

      {/* ── LEFT — Image collage ─────────────────────────────────────────── */}
      <div className="auth-left" style={{ width:"48%", position:"relative", overflow:"hidden", flexShrink:0 }}>
        {/* Dark forest green gradient over the collage */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,rgba(6,14,4,0.85) 0%,rgba(20,45,10,0.68) 40%,rgba(0,0,0,0.55) 100%)", zIndex:1 }} />

        {/* 3×3 Collage grid */}
        <div style={{ position:"absolute", inset:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gridTemplateRows:"1fr 1fr 1fr", gap:"3px" }}>
          <div className="auth-tile" style={{ gridColumn:"1/3", gridRow:"1/3", overflow:"hidden" }}>
            <img src={FARM_IMAGES[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
          <div className="auth-tile" style={{ overflow:"hidden" }}>
            <img src={FARM_IMAGES[1]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
          <div className="auth-tile" style={{ overflow:"hidden" }}>
            <img src={FARM_IMAGES[4]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
          <div className="auth-tile" style={{ overflow:"hidden" }}>
            <img src={FARM_IMAGES[3]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
          <div className="auth-tile" style={{ overflow:"hidden" }}>
            <img src={FARM_IMAGES[5]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
          <div className="auth-tile" style={{ overflow:"hidden" }}>
            <img src={FARM_IMAGES[2]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
        </div>

        {/* Content on top */}
        <div style={{ position:"relative", zIndex:2, padding:"3rem", display:"flex", flexDirection:"column", justifyContent:"center", height:"100%", boxSizing:"border-box" }}>
          <div style={{ animation:"slideRight 0.6s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"2.5rem" }}>
              <div style={{ width:"38px", height:"38px", background:"#3B6D11", borderRadius:"50% 8px 50% 8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8"/></svg>
              </div>
              <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:"24px", color:"white" }}>FarmLink</span>
            </div>
          </div>

          <div style={{ animation:"fadeInUp 0.6s 0.1s ease both" }}>
            <h1 style={{ fontFamily:"'DM Serif Display', serif", fontSize:"36px", color:"white", lineHeight:1.2, margin:"0 0 1rem" }}>
              Connecting<br />farmers, growing<br />together.
            </h1>
          </div>

          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"2rem", animation:"fadeInUp 0.6s 0.2s ease both" }}>
            {[["🌾","Rent Equipment"],["🤖","AI Advisor"],["🌍","3 Languages"]].map(([icon, lbl]) => (
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(151,196,89,0.2)", border:"0.5px solid rgba(151,196,89,0.45)", borderRadius:"20px", padding:"5px 12px", color:"white", fontSize:"11px", fontWeight:500 }}>
                <span>{icon}</span><span>{lbl}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"11px", animation:"fadeInUp 0.6s 0.3s ease both" }}>
            {[
              "Rent equipment from vendors & fellow farmers",
              "AI crop advice, disease detection & market data",
              "5-day weather forecast for farm planning",
              "Secure Razorpay payments — UPI, Cards & more",
              "Available in Hindi, Marathi & English",
            ].map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"13px", color:"rgba(255,255,255,0.82)" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#97C459", flexShrink:0 }} />
                {f}
              </div>
            ))}
          </div>

          {/* Bottom quote */}
          <div style={{ marginTop:"auto", paddingTop:"2rem", animation:"fadeInUp 0.6s 0.5s ease both" }}>
            <div style={{ background:"rgba(255,255,255,0.08)", borderLeft:"3px solid #97C459", borderRadius:"0 8px 8px 0", padding:"12px 16px" }}>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontStyle:"italic" }}>
                "Empowering 140M+ Indian farm households with affordable machinery access."
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form on top of farm bg image ─────────────────────────── */}
      <div className="auth-right" style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>

        {/* Background image for right side */}
        <img
          className="auth-right-bg"
          src={RIGHT_BG}
          alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", backgroundAttachment:"fixed" }}
        />
        {/* Rich overlay — dark green tint so form is readable */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(10,28,6,0.82) 0%, rgba(28,58,14,0.78) 50%, rgba(6,20,4,0.85) 100%)" }} />
        {/* Subtle grain texture */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", opacity:0.6 }} />

        {/* Mobile-only logo (hidden on desktop) */}
        <div className="auth-mobile-logo" style={{ position:"absolute", top:"1.5rem", left:"50%", transform:"translateX(-50%)", alignItems:"center", gap:"8px", zIndex:10 }}>
          <div style={{ width:"32px", height:"32px", background:"#3B6D11", borderRadius:"50% 6px 50% 6px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8"/></svg>
          </div>
          <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:"20px", color:"white" }}>FarmLink</span>
        </div>

        {/* Glassmorphism form card */}
        <div className="auth-form-box" style={{
          position:"relative", zIndex:1,
          width:"100%", maxWidth:"420px",
          background:"rgba(255,255,255,0.08)",
          backdropFilter:"blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          borderRadius:"20px",
          padding:"2rem",
          border:"1px solid rgba(255,255,255,0.15)",
          boxShadow:"0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
          animation:"formIn 0.5s ease both",
        }}>

          {/* Mode toggle */}
          <div style={{ display:"flex", background:"rgba(0,0,0,0.25)", borderRadius:"12px", padding:"4px", marginBottom:"1.75rem", gap:"4px", border:"1px solid rgba(255,255,255,0.1)" }}>
            {["login","register"].map(m => (
              <button key={m} className={`auth-mode-pill${mode===m?" active":""}`} onClick={() => switchMode(m)}
                style={{ flex:1, padding:"9px", borderRadius:"9px", border:"none", background: mode===m ? "rgba(59,109,17,0.7)" : "transparent", fontSize:"13px", fontWeight:500, cursor:"pointer", color: mode===m ? "white" : "rgba(255,255,255,0.55)", fontFamily:"inherit" }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (<>
              <Field id="name"  label="Full name"     placeholder="Ramesh Kumar" value={form.name}  onChange={e=>setField("name",e.target.value)}  error={fieldErrors.name} />
              <Field id="phone" label="Mobile number" placeholder="9876543210"   value={form.phone} onChange={e=>setField("phone",e.target.value)} error={fieldErrors.phone} />
            </>)}
            <Field id="email"    label="Email address"    type="email"    placeholder="you@example.com"  value={form.email}    onChange={e=>setField("email",e.target.value)}    error={fieldErrors.email} />
            <Field id="password" label="Password"         type="password" placeholder="Min. 6 characters" value={form.password}  onChange={e=>setField("password",e.target.value)} error={fieldErrors.password} />
            {mode === "register" && (
              <Field id="confirm" label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={e=>setField("confirm",e.target.value)} error={fieldErrors.confirm} />
            )}

            {mode === "register" && (
              <div style={{ marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.75)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>I am a</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  {ROLES.map(r => (
                    <button key={r.id} type="button" className="auth-role-card" onClick={() => setRole(r.id)}
                      style={{ borderRadius:"10px", padding:"11px 10px", border: role===r.id ? `1.5px solid ${r.border}` : "1px solid rgba(255,255,255,0.15)", background: role===r.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", textAlign:"left", position:"relative", fontFamily:"inherit" }}>
                      <div style={{ color: role===r.id ? r.border : "rgba(255,255,255,0.6)", marginBottom:"4px" }}>{r.icon}</div>
                      <div style={{ fontSize:"12px", fontWeight:600, color:"white", marginBottom:"2px" }}>{r.label}</div>
                      <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.55)", lineHeight:1.4 }}>{r.desc}</div>
                      {role===r.id && (
                        <div style={{ position:"absolute", top:"7px", right:"7px", width:"16px", height:"16px", borderRadius:"50%", background:r.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg viewBox="0 0 10 10" width="8" height="8" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background:"rgba(220,38,38,0.2)", border:"1px solid rgba(220,38,38,0.4)", borderRadius:"8px", padding:"10px 12px", fontSize:"13px", color:"#fca5a5", marginBottom:"1rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-submit"
              style={{ width:"100%", padding:"13px", borderRadius:"11px", border:"none", background: loading ? "rgba(59,109,17,0.5)" : "linear-gradient(135deg,#3B6D11,#5a9e1a)", color:"white", fontSize:"14px", fontWeight:600, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", letterSpacing:"0.02em" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in to FarmLink →" : "Create my account →"}
            </button>
          </form>

          {mode === "login" && (
            <div style={{ textAlign:"center", marginTop:"12px" }}>
              <a href="/forgot-password" style={{ fontSize:"12px", color:"rgba(151,196,89,0.9)", textDecoration:"none", fontWeight:500 }}>
                Forgot your password?
              </a>
            </div>
          )}

          <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"12px", color:"rgba(255,255,255,0.5)" }}>
            {mode === "login"
              ? <>Don't have an account?{" "}<span onClick={() => switchMode("register")} style={{ color:"#97C459", cursor:"pointer", fontWeight:500 }}>Sign up free</span></>
              : <>Already have an account?{" "}<span onClick={() => switchMode("login")} style={{ color:"#97C459", cursor:"pointer", fontWeight:500 }}>Sign in</span></>
            }
          </div>

          <div style={{ marginTop:"1.5rem", paddingTop:"1.25rem", borderTop:"1px solid rgba(255,255,255,0.1)", textAlign:"center" }}>
            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>vendor accounts require admin approval</span>
          </div>
        </div>
      </div>
    </div>
  );
}