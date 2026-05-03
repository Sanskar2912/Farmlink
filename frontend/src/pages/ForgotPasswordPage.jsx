import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.match(/^\S+@\S+\.\S+$/)) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoLeaf}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8"/>
            </svg>
          </div>
          <span style={s.logoText}>FarmLink</span>
        </div>

        {sent ? (
          <div style={s.successBox}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>📧</div>
            <div style={s.successTitle}>Check your email</div>
            <div style={s.successMsg}>
              If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
            </div>
            <button onClick={() => navigate("/auth")} style={s.backBtn}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div style={s.title}>Forgot your password?</div>
            <div style={s.sub}>Enter your registered email and we'll send you a reset link.</div>

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  style={error ? s.inputErr : s.input}
                />
                {error && <div style={s.fieldErr}>{error}</div>}
              </div>

              <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div style={s.backRow}>
              <span onClick={() => navigate("/auth")} style={s.backLink}>← Back to Sign In</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F6F3", fontFamily:"'DM Sans', sans-serif", padding:"1rem" },
  card:         { width:"100%", maxWidth:"400px", background:"white", borderRadius:"16px", padding:"2rem", border:"0.5px solid #E8E6E0" },
  logo:         { display:"flex", alignItems:"center", gap:"8px", marginBottom:"1.75rem", justifyContent:"center" },
  logoLeaf:     { width:"32px", height:"32px", background:"#3B6D11", borderRadius:"50% 6px 50% 6px", display:"flex", alignItems:"center", justifyContent:"center" },
  logoText:     { fontFamily:"'DM Serif Display', serif", fontSize:"22px", color:"#1C3A0E" },
  title:        { fontSize:"20px", fontWeight:500, color:"#1a1a1a", marginBottom:"6px", textAlign:"center" },
  sub:          { fontSize:"13px", color:"#888", textAlign:"center", marginBottom:"1.5rem", lineHeight:1.6 },
  field:        { marginBottom:"1.25rem" },
  label:        { display:"block", fontSize:"12px", fontWeight:500, color:"#555", marginBottom:"6px" },
  input:        { width:"100%", padding:"10px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"14px", fontFamily:"inherit", outline:"none", background:"white", color:"#1a1a1a", boxSizing:"border-box" },
  inputErr:     { width:"100%", padding:"10px 12px", borderRadius:"8px", border:"0.5px solid #E24B4A", fontSize:"14px", fontFamily:"inherit", outline:"none", background:"#FFFAFA", color:"#1a1a1a", boxSizing:"border-box" },
  fieldErr:     { fontSize:"11px", color:"#A32D2D", marginTop:"4px" },
  submitBtn:    { width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:"#3B6D11", color:"white", fontSize:"14px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  backRow:      { textAlign:"center", marginTop:"1.25rem" },
  backLink:     { fontSize:"12px", color:"#3B6D11", cursor:"pointer", fontWeight:500 },
  successBox:   { textAlign:"center", padding:"1rem 0" },
  successTitle: { fontSize:"18px", fontWeight:500, marginBottom:"10px", color:"#1a1a1a" },
  successMsg:   { fontSize:"13px", color:"#555", lineHeight:1.6, marginBottom:"1.5rem" },
  backBtn:      { padding:"10px 24px", borderRadius:"10px", border:"none", background:"#3B6D11", color:"white", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
};