import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

export default function AdminVendors({ onApproval }) {
  const { authFetch }   = useAuth();
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast]       = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/admin/vendors/pending");
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleAction = async (id, action) => {
    setActionId(id);
    try {
      const res  = await authFetch(`/api/admin/vendors/${id}/${action}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      if (action === "approve") onApproval?.();
      load();
    } catch (err) {
      showToast(err.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={s.header}>
        <div style={s.title}>Vendor Approval Queue</div>
        <div style={s.count}>{vendors.length} pending</div>
      </div>

      {loading && <div style={s.center}>Loading…</div>}

      {!loading && vendors.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
          <div style={{ fontWeight: 500 }}>All caught up!</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>No pending vendor applications.</div>
        </div>
      )}

      <div style={s.list}>
        {vendors.map((v) => (
          <div key={v._id} style={s.card}>
            <div style={s.cardLeft}>
              <div style={s.avatar}>{v.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={s.vendorName}>{v.name}</div>
                {v.shopName && <div style={s.shopName}>{v.shopName}</div>}
                <div style={s.meta}>
                  <span>📧 {v.email}</span>
                  <span>📱 {v.phone}</span>
                  {v.shopCity && <span>📍 {v.shopCity}</span>}
                </div>
                <div style={s.applied}>Applied: {new Date(v.createdAt).toLocaleDateString("en-IN")}</div>
              </div>
            </div>
            <div style={s.actions}>
              <button
                onClick={() => handleAction(v._id, "approve")}
                disabled={actionId === v._id}
                style={s.approveBtn}
              >
                {actionId === v._id ? "…" : "✓ Approve"}
              </button>
              <button
                onClick={() => handleAction(v._id, "reject")}
                disabled={actionId === v._id}
                style={s.rejectBtn}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  title:      { fontSize: "15px", fontWeight: 500 },
  count:      { fontSize: "12px", padding: "4px 10px", borderRadius: "8px", background: "#FAEEDA", color: "#633806", fontWeight: 500 },
  list:       { display: "flex", flexDirection: "column", gap: "10px" },
  card:       { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "1.1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" },
  cardLeft:   { display: "flex", alignItems: "center", gap: "14px", flex: 1 },
  avatar:     { width: "42px", height: "42px", borderRadius: "50%", background: "#EEEDFE", color: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: "16px", flexShrink: 0 },
  vendorName: { fontSize: "14px", fontWeight: 500, marginBottom: "2px" },
  shopName:   { fontSize: "12px", color: "#3B6D11", fontWeight: 500, marginBottom: "4px" },
  meta:       { display: "flex", gap: "14px", fontSize: "12px", color: "#888", flexWrap: "wrap", marginBottom: "4px" },
  applied:    { fontSize: "11px", color: "#AAA" },
  actions:    { display: "flex", gap: "8px", flexShrink: 0 },
  approveBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#3B6D11", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  rejectBtn:  { padding: "8px 16px", borderRadius: "8px", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#791F1F", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  center:     { textAlign: "center", padding: "3rem", color: "#888" },
  empty:      { textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0" },
  toast:      { position: "fixed", bottom: "24px", right: "24px", background: "#1C3A0E", color: "white", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", zIndex: 999 },
};
