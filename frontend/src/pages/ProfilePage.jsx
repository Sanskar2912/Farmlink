import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

const SOIL_TYPES = ["Alluvial","Black Cotton","Red Loamy","Sandy Loam","Laterite","Clay","Other"];
const STATES     = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh","Rajasthan","Bihar","Gujarat","Karnataka","Tamil Nadu","Other"];

// ✅ FIXED: All field components defined OUTSIDE parent
function Field({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={s.input} />
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <select style={s.input} value={value} onChange={onChange}>{children}</select>
    </div>
  );
}

export default function ProfilePage() {
  const { user, authFetch, login, token } = useAuth();

  const [form, setForm] = useState({
    name:         user?.name         || "",
    phone:        user?.phone        || "",
    farmLocation: user?.farmLocation || "",
    shopName:     user?.shopName     || "",
    shopCity:     user?.shopCity     || "",
    soilType:     user?.soilType     || "",
  });

  const [pwForm,    setPwForm]    = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving,    setSaving]    = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [toast,     setToast]     = useState("");
  const [toastType, setToastType] = useState("success");
  const [tab,       setTab]       = useState("profile");

  const showToast = (msg, type = "success") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 3500);
  };

  const setField    = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setPwField  = (key) => (e) => setPwForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await authFetch("/api/auth/profile", { method: "PATCH", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data.user, token);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.message || "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { showToast("Passwords do not match.", "error"); return; }
    if (pwForm.newPassword.length < 6)         { showToast("Password must be at least 6 characters.", "error"); return; }
    setPwSaving(true);
    try {
      const res  = await authFetch("/api/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data.user, data.token);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.message || "Password change failed.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  const ROLE_BADGE = {
    farmer: { background: "#EAF3DE", color: "#27500A" },
    vendor: { background: "#E1F5EE", color: "#085041" },
    admin:  { background: "#EEEDFE", color: "#3C3489" },
  };

  return (
    <div style={s.page}>
      {toast && <div style={{ ...s.toast, background: toastType === "error" ? "#A32D2D" : "#1C3A0E" }}>{toast}</div>}

      <div style={s.header}>
        <div style={s.avatarLarge}>{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h1 style={s.name}>{user?.name}</h1>
          <p style={s.meta}>{user?.email} · {user?.phone}</p>
          <span style={{ ...s.roleBadge, ...ROLE_BADGE[user?.role] }}>
            {user?.role}{user?.role === "vendor" && user?.vendorStatus ? ` · ${user.vendorStatus}` : ""}
          </span>
        </div>
      </div>

      <div style={s.tabs}>
        {[["profile","👤 Profile"],["password","🔒 Password"],["language","🌐 Language"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={tab === id ? s.tabActive : s.tab}>{label}</button>
        ))}
      </div>

      {tab === "profile" && (
        <div style={s.formCard}>
          <form onSubmit={handleSave}>
            <div style={s.section}>Personal Information</div>
            <div style={s.row2}>
              <Field label="Full name"      placeholder="Your full name"    value={form.name}  onChange={setField("name")} />
              <Field label="Mobile number"  placeholder="10-digit mobile"   value={form.phone} onChange={setField("phone")} />
            </div>
            {user?.role === "farmer" && (<>
              <div style={s.section}>Farm Details</div>
              <div style={s.row2}>
                <Field label="Farm location / village" placeholder="e.g. Kanpur, UP" value={form.farmLocation} onChange={setField("farmLocation")} />
                <SelectField label="Soil type" value={form.soilType} onChange={setField("soilType")}>
                  <option value="">Select soil type</option>
                  {SOIL_TYPES.map(st => <option key={st} value={st.toLowerCase().replace(" ","")}>{st}</option>)}
                </SelectField>
              </div>
            </>)}
            {user?.role === "vendor" && (<>
              <div style={s.section}>Shop Details</div>
              <div style={s.row2}>
                <Field label="Shop / business name" placeholder="e.g. Agro Tools Ltd" value={form.shopName} onChange={setField("shopName")} />
                <Field label="Shop city"            placeholder="e.g. Lucknow"          value={form.shopCity} onChange={setField("shopCity")} />
              </div>
            </>)}
            <div style={s.btnRow}>
              <button type="submit" disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "password" && (
        <div style={s.formCard}>
          <form onSubmit={handlePasswordChange}>
            <div style={s.section}>Change Password</div>
            <Field label="Current password"    type="password" placeholder="Enter current password" value={pwForm.currentPassword} onChange={setPwField("currentPassword")} />
            <Field label="New password"        type="password" placeholder="Min. 6 characters"       value={pwForm.newPassword}     onChange={setPwField("newPassword")} />
            <Field label="Confirm new password" type="password" placeholder="Repeat new password"    value={pwForm.confirm}         onChange={setPwField("confirm")} />
            <div style={s.btnRow}>
              <button type="submit" disabled={pwSaving} style={{ ...s.saveBtn, opacity: pwSaving ? 0.7 : 1 }}>
                {pwSaving ? "Changing…" : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "language" && (
        <div style={s.formCard}>
          <div style={s.section}>Display Language</div>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "1.25rem" }}>
            Choose the language for the FarmLink interface. All buttons, labels and messages will switch instantly.
          </p>
          <LanguageSwitcher compact={false} />
          <div style={{ marginTop: "1rem", padding: "10px 14px", background: "#EAF3DE", borderRadius: "8px", fontSize: "12px", color: "#27500A" }}>
            ✅ Your language preference is saved automatically and will persist across sessions.
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:        { padding: "2rem", maxWidth: "640px", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" },
  header:      { display: "flex", alignItems: "center", gap: "18px", marginBottom: "1.75rem", background: "white", borderRadius: "14px", border: "0.5px solid #E8E6E0", padding: "1.25rem 1.5rem" },
  avatarLarge: { width: "60px", height: "60px", borderRadius: "50%", background: "#EAF3DE", color: "#27500A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 500, flexShrink: 0 },
  name:        { fontFamily: "'DM Serif Display', serif", fontSize: "22px", margin: "0 0 4px" },
  meta:        { fontSize: "13px", color: "#888", margin: "0 0 8px" },
  roleBadge:   { fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "8px", textTransform: "capitalize" },
  tabs:        { display: "flex", gap: "4px", borderBottom: "0.5px solid #E8E6E0", marginBottom: "1.25rem" },
  tab:         { padding: "10px 16px", border: "none", background: "transparent", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#888", borderBottom: "2px solid transparent", fontFamily: "inherit" },
  tabActive:   { padding: "10px 16px", border: "none", background: "transparent", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#1a1a1a", borderBottom: "2px solid #1a1a1a", fontFamily: "inherit" },
  formCard:    { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "1.5rem" },
  section:     { fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", margin: "1rem 0 10px", paddingBottom: "6px", borderBottom: "0.5px solid #F0EEE9" },
  row2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  field:       { marginBottom: "1rem" },
  label:       { display: "block", fontSize: "12px", fontWeight: 500, color: "#555", marginBottom: "5px" },
  input:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "white" },
  btnRow:      { marginTop: "1.25rem" },
  saveBtn:     { padding: "11px 24px", borderRadius: "8px", border: "none", background: "#3B6D11", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  toast:       { position: "fixed", bottom: "24px", right: "24px", color: "white", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", zIndex: 999 },
};
