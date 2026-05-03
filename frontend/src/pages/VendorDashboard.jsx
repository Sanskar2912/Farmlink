import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Inject responsive styles once into <head>
const RESPONSIVE_STYLES = `
  @media (max-width: 599px) {
    .vd-stat-grid         { display: flex !important; overflow-x: auto; gap: 10px !important; padding-bottom: 6px; scrollbar-width: none; margin-bottom: 4px !important; }
    .vd-stat-grid::-webkit-scrollbar { display: none; }
    .vd-stat-card         { min-width: 118px !important; flex-shrink: 0; }
    .vd-stat-val          { font-size: 18px !important; }
    .vd-grid2             { grid-template-columns: 1fr !important; }
    .vd-welcome           { flex-direction: column !important; }
    .vd-header-btns       { width: 100%; }
    .vd-header-btns button { flex: 1; }
    .vd-req-row           { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
    .vd-req-right         { flex-direction: column !important; align-items: stretch !important; }
    .vd-req-btns          { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
    .vd-req-amt           { font-size: 13px !important; }
    .vd-scroll-hint       { display: block !important; }
    .vd-listings-grid     { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  }
  @media (min-width: 600px) and (max-width: 899px) {
    .vd-stat-grid         { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
    .vd-listings-grid     { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
  }
  .vd-scroll-hint { display: none; text-align: center; font-size: 10px; color: #AAA; margin-top: 4px; }
`;

function injectStyles() {
  if (document.getElementById("vd-responsive")) return;
  const el = document.createElement("style");
  el.id = "vd-responsive";
  el.textContent = RESPONSIVE_STYLES;
  document.head.appendChild(el);
}

function BarChart({ data, color = "#0F6E56" }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "64px" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={{ width: "100%", height: `${Math.round((v / max) * 56)}px`, background: color, borderRadius: "3px 3px 0 0", minHeight: v > 0 ? "4px" : "0", opacity: 0.8 }} />
          <span style={{ fontSize: "9px", color: "#AAA" }}>{MONTH_LABELS[i]?.slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="vd-stat-card" style={s.statCard}>
      <div style={s.statTop}>
        <div style={s.statLabel}>{label}</div>
        {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
      </div>
      <div className="vd-stat-val" style={{ ...s.statVal, color: color || "#1a1a1a" }}>{value}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  );
}

export default function VendorDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast,    setToast]    = useState("");

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [lRes, iRes] = await Promise.all([
          authFetch("/api/equipment/my/listings"),
          authFetch("/api/bookings/incoming"),
        ]);
        const [lData, iData] = await Promise.all([lRes.json(), iRes.json()]);
        setListings(lData.equipment || []);
        setIncoming(iData.bookings  || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleAction = async (bookingId, action) => {
    setActionId(bookingId);
    try {
      const res  = await authFetch(`/api/bookings/${bookingId}/${action}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(`Booking ${action}ed successfully.`);
      setIncoming(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: action === "confirm" ? "confirmed" : "cancelled" } : b
      ));
    } catch (err) {
      showToast(err.message || "Action failed.");
    } finally {
      setActionId(null);
    }
  };

  // Stats
  const totalRevenue   = incoming.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.totalAmount || 0), 0);
  const pendingCount   = incoming.filter(b => b.status === "pending").length;
  const activeCount    = incoming.filter(b => b.status === "confirmed").length;
  const completedCount = incoming.filter(b => b.status === "completed").length;
  const avgRating      = listings.length
    ? (listings.reduce((s, l) => s + (l.rating || 0), 0) / listings.length).toFixed(1)
    : "—";

  const chartData = Array.from({ length: 12 }, (_, i) =>
    incoming
      .filter(b => b.paymentStatus === "paid" && new Date(b.createdAt).getMonth() === i)
      .reduce((s, b) => s + (b.totalAmount || 0), 0)
  );

  const STATUS_STYLE = {
    pending:   { bg: "#FAEEDA", color: "#633806" },
    confirmed: { bg: "#EAF3DE", color: "#27500A" },
    cancelled: { bg: "#FCEBEB", color: "#791F1F" },
    completed: { bg: "#E1F5EE", color: "#085041" },
  };

  if (loading) return <div style={s.center}>Loading vendor dashboard…</div>;

  const pendingList = incoming.filter(b => b.status === "pending");

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Header */}
      <div className="vd-welcome" style={s.welcome}>
        <div>
          <h1 style={s.title}>{user?.shopName || user?.name}</h1>
          <p style={s.sub}>Verified Vendor · {user?.shopCity || "India"} · ⭐ {avgRating !== "—" ? avgRating : "No ratings yet"}</p>
        </div>
        <div className="vd-header-btns" style={s.headerBtns}>
          <button onClick={() => navigate("/bookings")}      style={s.outlineBtn}>All Bookings</button>
          <button onClick={() => navigate("/equipment/new")} style={s.primaryBtn}>+ Add Listing</button>
        </div>
      </div>

      {/* Stats — horizontal scroll on mobile */}
      <div className="vd-stat-grid" style={s.statGrid}>
        <StatCard label="Total Revenue"    value={`₹${totalRevenue.toLocaleString()}`} color="#0F6E56" icon="💰" sub="From paid bookings" />
        <StatCard label="Pending requests" value={pendingCount}  color={pendingCount > 0 ? "#A32D2D" : "#0F6E56"} icon="📋" sub="Need your action" />
        <StatCard label="Active rentals"   value={activeCount}   icon="🚜" sub="Currently out" />
        <StatCard label="Completed"        value={completedCount} icon="✅" sub="All time" />
        <StatCard label="Total listings"   value={listings.length} icon="📦" sub="Equipment listed" />
      </div>
      <div className="vd-scroll-hint">← swipe for more →</div>

      <div className="vd-grid2" style={{ ...s.grid2, marginTop: "1.25rem" }}>
        {/* Revenue chart */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardTitle}>Revenue This Year</div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F6E56" }}>₹{totalRevenue.toLocaleString()}</div>
          </div>
          <BarChart data={chartData} color="#0F6E56" />
        </div>

        {/* Booking status breakdown */}
        <div style={s.card}>
          <div style={s.cardHead}><div style={s.cardTitle}>Booking Breakdown</div></div>
          {[
            { label: "Pending",   count: pendingCount,                                           style: STATUS_STYLE.pending   },
            { label: "Confirmed", count: activeCount,                                            style: STATUS_STYLE.confirmed },
            { label: "Completed", count: completedCount,                                         style: STATUS_STYLE.completed },
            { label: "Cancelled", count: incoming.filter(b => b.status === "cancelled").length,  style: STATUS_STYLE.cancelled },
          ].map((item) => (
            <div key={item.label} style={s.breakdownRow}>
              <span style={{ ...s.statusPill, background: item.style.bg, color: item.style.color }}>{item.label}</span>
              <div style={s.breakdownBar}>
                <div style={{ height: "6px", borderRadius: "3px", background: item.style.color, width: `${Math.round((item.count / Math.max(incoming.length, 1)) * 100)}%`, opacity: 0.7 }} />
              </div>
              <span style={s.breakdownCount}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending booking requests */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <div style={s.cardTitle}>
            Booking Requests
            {pendingCount > 0 && <span style={s.badge}>{pendingCount} pending</span>}
          </div>
          <button onClick={() => navigate("/bookings")} style={s.linkBtn}>View all →</button>
        </div>
        {pendingList.slice(0, 5).map((b) => (
          <div key={b._id} className="vd-req-row" style={s.reqRow}>
            <div style={s.reqInfo}>
              <div style={s.reqName}>{b.equipment?.name || "Equipment"}</div>
              <div style={s.reqMeta}>
                {b.renter?.name} · {new Date(b.fromDate).toLocaleDateString("en-IN")} → {new Date(b.toDate).toLocaleDateString("en-IN")} · {b.totalDays} day{b.totalDays > 1 ? "s" : ""}
              </div>
            </div>
            <div className="vd-req-right" style={s.reqRight}>
              <div className="vd-req-amt" style={s.reqAmt}>₹{b.totalAmount?.toLocaleString()}</div>
              <div className="vd-req-btns" style={s.reqBtns}>
                <button onClick={() => handleAction(b._id, "confirm")} disabled={actionId === b._id} style={s.confirmBtn}>
                  {actionId === b._id ? "…" : "✓ Confirm"}
                </button>
                <button onClick={() => handleAction(b._id, "cancel")} disabled={actionId === b._id} style={s.rejectBtn}>
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {pendingList.length === 0 && (
          <div style={s.emptySmall}>No pending requests — all caught up! 🎉</div>
        )}
      </div>

      {/* My listings */}
      <div style={{ ...s.card, marginTop: "14px" }}>
        <div style={s.cardHead}>
          <div style={s.cardTitle}>My Equipment ({listings.length})</div>
          <button onClick={() => navigate("/equipment/new")} style={s.linkBtn}>+ Add listing →</button>
        </div>
        <div className="vd-listings-grid" style={s.listingsGrid}>
          {listings.map((eq) => (
            <div key={eq._id} style={s.listingCard} onClick={() => navigate(`/equipment/${eq._id}`)}>
              <div style={s.listingImg}>{["🚜","🌾","💧","🌱","⛽","🔧"][Math.floor(Math.random() * 6)]}</div>
              <div style={s.listingName}>{eq.name}</div>
              <div style={s.listingPrice}>₹{eq.pricePerDay?.toLocaleString()}/day</div>
              <div style={s.listingFooter}>
                <span style={{ fontSize: "11px", color: "#888" }}>⭐ {eq.rating > 0 ? eq.rating.toFixed(1) : "—"} ({eq.totalReviews})</span>
                <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "6px", background: eq.isAvailable ? "#EAF3DE" : "#FAEEDA", color: eq.isAvailable ? "#27500A" : "#633806", fontWeight: 500 }}>
                  {eq.isAvailable ? "Available" : "Rented"}
                </span>
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <div style={{ ...s.emptySmall, gridColumn: "1/-1" }}>
              No listings yet.{" "}
              <span style={{ color: "#0F6E56", cursor: "pointer" }} onClick={() => navigate("/equipment/new")}>
                Add your first equipment
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:          { padding: "2rem", maxWidth: "1100px", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" },
  welcome:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" },
  title:         { fontFamily: "'DM Serif Display', serif", fontSize: "26px", margin: "0 0 4px" },
  sub:           { fontSize: "13px", color: "#888", margin: 0 },
  headerBtns:    { display: "flex", gap: "10px" },
  primaryBtn:    { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#0F6E56", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  outlineBtn:    { padding: "9px 18px", borderRadius: "8px", border: "0.5px solid #5DCAA5", background: "#E1F5EE", color: "#0F6E56", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  statGrid:      { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: "12px", marginBottom: "4px" },
  statCard:      { background: "white", borderRadius: "10px", border: "0.5px solid #E8E6E0", padding: "1rem" },
  statTop:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  statLabel:     { fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  statVal:       { fontSize: "22px", fontWeight: 500, marginBottom: "4px" },
  statSub:       { fontSize: "11px", color: "#AAA" },
  grid2:         { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "14px", marginBottom: "14px" },
  card:          { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "1.1rem 1.25rem" },
  cardHead:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  cardTitle:     { fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" },
  badge:         { fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: "#FAEEDA", color: "#633806", fontWeight: 500 },
  linkBtn:       { fontSize: "12px", color: "#0F6E56", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" },
  breakdownRow:  { display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: "0.5px solid #F0EEE9" },
  statusPill:    { fontSize: "10px", padding: "2px 8px", borderRadius: "6px", fontWeight: 500, width: "72px", textAlign: "center", flexShrink: 0 },
  breakdownBar:  { flex: 1, height: "6px", background: "#F0EEE9", borderRadius: "3px", overflow: "hidden" },
  breakdownCount:{ fontSize: "13px", fontWeight: 500, minWidth: "24px", textAlign: "right" },
  reqRow:        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #F0EEE9", gap: "12px" },
  reqInfo:       { flex: 1 },
  reqName:       { fontSize: "13px", fontWeight: 500, marginBottom: "3px" },
  reqMeta:       { fontSize: "11px", color: "#888" },
  reqRight:      { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 },
  reqAmt:        { fontSize: "14px", fontWeight: 500, color: "#0F6E56" },
  reqBtns:       { display: "flex", gap: "6px" },
  confirmBtn:    { padding: "5px 12px", borderRadius: "6px", border: "none", background: "#0F6E56", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  rejectBtn:     { padding: "5px 12px", borderRadius: "6px", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#791F1F", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  listingsGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" },
  listingCard:   { border: "0.5px solid #E8E6E0", borderRadius: "10px", padding: "10px", cursor: "pointer", transition: "border-color .15s" },
  listingImg:    { fontSize: "24px", marginBottom: "6px" },
  listingName:   { fontSize: "12px", fontWeight: 500, marginBottom: "3px" },
  listingPrice:  { fontSize: "12px", color: "#0F6E56", fontWeight: 500, marginBottom: "6px" },
  listingFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  emptySmall:    { padding: "1rem 0", fontSize: "13px", color: "#888", textAlign: "center" },
  toast:         { position: "fixed", bottom: "24px", right: "24px", background: "#1C3A0E", color: "white", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", zIndex: 999 },
  center:        { textAlign: "center", padding: "4rem", color: "#888", fontFamily: "'DM Sans', sans-serif" },
};