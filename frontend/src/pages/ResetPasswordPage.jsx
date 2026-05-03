import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function ResetPasswordPage() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const { login }  = useAuth();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6)      { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)      { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/auth/reset-password/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Auto login after reset
      login(data.user, data.token);
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Reset failed. Please try again.");
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

        {done ? (
          <div style={s.successBox}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
            <div style={s.successTitle}>Password reset!</div>
            <div style={s.successMsg}>Your password has been updated. Redirecting you to your dashboard…</div>
          </div>
        ) : (
          <>
            <div style={s.title}>Set a new password</div>
            <div style={s.sub}>Choose a strong password for your FarmLink account.</div>

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>New password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm new password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  style={s.input}
                />
              </div>

              {error && <div style={s.errBox}>{error}</div>}

              <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Resetting…" : "Reset Password"}
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
  errBox:       { background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:"8px", padding:"10px 12px", fontSize:"13px", color:"#791F1F", marginBottom:"1rem" },
  submitBtn:    { width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:"#3B6D11", color:"white", fontSize:"14px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  backRow:      { textAlign:"center", marginTop:"1.25rem" },
  backLink:     { fontSize:"12px", color:"#3B6D11", cursor:"pointer", fontWeight:500 },
  successBox:   { textAlign:"center", padding:"1rem 0" },
  successTitle: { fontSize:"18px", fontWeight:500, marginBottom:"10px", color:"#1a1a1a" },
  successMsg:   { fontSize:"13px", color:"#555", lineHeight:1.6 },
};