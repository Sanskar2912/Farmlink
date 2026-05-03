import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Inject responsive styles once
const RESPONSIVE_STYLES = `
  @media (max-width: 599px) {
    .fd-stat-grid       { grid-template-columns: unset !important; display: flex !important; overflow-x: auto; gap: 10px !important; padding-bottom: 6px; scrollbar-width: none; }
    .fd-stat-grid::-webkit-scrollbar { display: none; }
    .fd-stat-card       { min-width: 120px !important; flex-shrink: 0; }
    .fd-stat-val        { font-size: 18px !important; }
    .fd-grid2           { grid-template-columns: 1fr !important; }
    .fd-quick-grid      { grid-template-columns: 1fr 1fr !important; }
    .fd-quick-btn       { flex-direction: row !important; gap: 12px !important; padding: 0.85rem !important; }
    .fd-header-btns     { width: 100%; }
    .fd-header-btns button { flex: 1; }
    .fd-welcome         { flex-direction: column !important; }
    .fd-booking-row     { padding: 10px 0 !important; }
    .fd-listing-row     { padding: 10px 0 !important; }
    .fd-scroll-hint     { display: block !important; }
    .fd-section-mobile  { display: block !important; }
    .fd-chart-card      { order: 3; }
  }
  @media (min-width: 600px) and (max-width: 899px) {
    .fd-stat-grid       { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
    .fd-quick-grid      { grid-template-columns: repeat(4, minmax(0,1fr)) !important; }
  }
  .fd-scroll-hint { display: none; text-align: center; font-size: 10px; color: #AAA; margin-top: 4px; }
`;

function injectStyles() {
  if (document.getElementById("fd-responsive")) return;
  const el = document.createElement("style");
  el.id = "fd-responsive";
  el.textContent = RESPONSIVE_STYLES;
  document.head.appendChild(el);
}

function MiniBarChart({ data, color = "#3B6D11" }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "48px" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={{ width: "100%", height: `${Math.round((v / max) * 40)}px`, background: color, borderRadius: "3px 3px 0 0", minHeight: v > 0 ? "4px" : "0", opacity: 0.85 }} />
          <span style={{ fontSize: "9px", color: "#AAA" }}>{MONTH_LABELS[i]?.slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="fd-stat-card" style={s.statCard}>
      <div style={s.statTop}>
        <div style={s.statLabel}>{label}</div>
        {icon && <span style={{ fontSize: "16px" }}>{icon}</span>}
      </div>
      <div className="fd-stat-val" style={{ ...s.statVal, color: color || "#1a1a1a" }}>{value}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  );
}

export default function FarmerDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [myBookings,       setMyBookings]  = useState([]);
  const [myListings,       setMyListings]  = useState([]);
  const [incomingBookings, setIncoming]    = useState([]);
  const [loading,          setLoading]     = useState(true);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, lRes, iRes] = await Promise.all([
          authFetch("/api/bookings/my"),
          authFetch("/api/equipment/my/listings"),
          authFetch("/api/bookings/incoming"),
        ]);
        const [bData, lData, iData] = await Promise.all([bRes.json(), lRes.json(), iRes.json()]);
        setMyBookings(bData.bookings  || []);
        setMyListings(lData.equipment || []);
        setIncoming(iData.bookings    || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalEarned     = incomingBookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.totalAmount || 0), 0);
  const activeRentals   = myBookings.filter(b => b.status === "confirmed").length;
  const pendingIncoming = incomingBookings.filter(b => b.status === "pending").length;
  const avgRating       = myListings.length
    ? (myListings.reduce((s, l) => s + (l.rating || 0), 0) / myListings.length).toFixed(1)
    : "—";

  const chartData = Array.from({ length: 12 }, (_, i) =>
    incomingBookings
      .filter(b => b.paymentStatus === "paid" && new Date(b.createdAt).getMonth() === i)
      .reduce((s, b) => s + (b.totalAmount || 0), 0)
  );

  const STATUS_STYLE = {
    pending:   { bg: "#FAEEDA", color: "#633806" },
    confirmed: { bg: "#EAF3DE", color: "#27500A" },
    cancelled: { bg: "#FCEBEB", color: "#791F1F" },
    completed: { bg: "#E1F5EE", color: "#085041" },
  };

  if (loading) return <div style={s.center}>Loading your dashboard…</div>;

  const pendingList = incomingBookings.filter(b => b.status === "pending");

  return (
    <div style={s.page}>

      {/* Welcome header */}
      <div className="fd-welcome" style={s.welcome}>
        <div>
          <h1 style={s.title}>Good morning, {user?.name?.split(" ")[0]} 👋</h1>
          <p style={s.sub}>Farmer · {user?.farmLocation || "Uttar Pradesh"} · Member since {new Date(user?.createdAt).getFullYear()}</p>
        </div>
        <div className="fd-header-btns" style={s.headerBtns}>
          <button onClick={() => navigate("/equipment")}     style={s.outlineBtn}>Browse Equipment</button>
          <button onClick={() => navigate("/equipment/new")} style={s.primaryBtn}>+ List Equipment</button>
        </div>
      </div>

      {/* Stats — horizontal scroll on mobile, grid on larger screens */}
      <div className="fd-stat-grid" style={s.statGrid}>
        <StatCard label="Earned from rentals" value={`₹${totalEarned.toLocaleString()}`}  color="#3B6D11" icon="💰" sub="From your listings" />
        <StatCard label="My active rentals"   value={activeRentals}                        icon="🚜"        sub="Currently rented" />
        <StatCard label="Pending requests"    value={pendingIncoming}                      color={pendingIncoming > 0 ? "#A32D2D" : "#3B6D11"} icon="📋" sub="Need your response" />
        <StatCard label="My listings"         value={myListings.length}                    icon="📦"        sub="Active equipment" />
        <StatCard label="Avg. rating"         value={avgRating !== "—" ? `${avgRating} ★` : "—"} icon="⭐" sub="From renters" />
      </div>
      <div className="fd-scroll-hint">← swipe for more →</div>

      {/* Quick links — moved up on mobile for thumb reach, stays at bottom on desktop */}
      <div className="fd-section-mobile" style={{ display: "none", marginBottom: "14px" }}>
        <div className="fd-quick-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "10px" }}>
          {[
            { icon: "🤖", label: "AI Crop Advice",   path: "/ai-advisor", color: "#EAF3DE" },
            { icon: "⛅", label: "Weather Forecast",  path: "/weather",    color: "#E1F5EE" },
            { icon: "📋", label: "All My Bookings",   path: "/bookings",   color: "#EEEDFE" },
            { icon: "👤", label: "Edit My Profile",   path: "/profile",    color: "#FAEEDA" },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="fd-quick-btn"
              style={{ ...s.quickBtn, background: item.color, flexDirection: "row", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span style={s.quickLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fd-grid2" style={s.grid2}>
        {/* Earnings chart */}
        <div className="fd-chart-card" style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardTitle}>Rental Earnings This Year</div>
            <div style={s.cardSub}>₹{totalEarned.toLocaleString()} total</div>
          </div>
          <MiniBarChart data={chartData} color="#3B6D11" />
        </div>

        {/* Pending incoming bookings */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardTitle}>Pending Requests</div>
            <button onClick={() => navigate("/bookings")} style={s.linkBtn}>View all →</button>
          </div>
          {pendingList.slice(0, 3).map((b, i) => (
            <div key={i} className="fd-booking-row" style={s.bookingRow}>
              <div style={s.bookingInfo}>
                <div style={s.bookingName}>{b.equipment?.name || "Equipment"}</div>
                <div style={s.bookingMeta}>{b.renter?.name} · {new Date(b.fromDate).toLocaleDateString("en-IN")} → {new Date(b.toDate).toLocaleDateString("en-IN")}</div>
              </div>
              <div style={s.bookingRight}>
                <div style={s.bookingAmt}>₹{b.totalAmount?.toLocaleString()}</div>
                <button onClick={() => navigate("/bookings")} style={s.respondBtn}>Respond</button>
              </div>
            </div>
          ))}
          {pendingList.length === 0 && (
            <div style={s.emptySmall}>No pending requests 🎉</div>
          )}
        </div>
      </div>

      <div className="fd-grid2" style={s.grid2}>
        {/* My listings */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardTitle}>My Equipment Listings</div>
            <button onClick={() => navigate("/equipment/new")} style={s.linkBtn}>+ Add →</button>
          </div>
          {myListings.slice(0, 4).map((eq, i) => (
            <div key={i} className="fd-listing-row" style={s.listingRow} onClick={() => navigate(`/equipment/${eq._id}`)}>
              <div style={s.listingIcon}>{["🚜","🌾","💧","🌱","⛽","🔧"][i % 6]}</div>
              <div style={s.listingInfo}>
                <div style={s.listingName}>{eq.name}</div>
                <div style={s.listingMeta}>₹{eq.pricePerDay?.toLocaleString()}/day · {eq.city}</div>
              </div>
              <div style={s.listingRight}>
                <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "8px", background: eq.isAvailable ? "#EAF3DE" : "#FAEEDA", color: eq.isAvailable ? "#27500A" : "#633806", fontWeight: 500 }}>
                  {eq.isAvailable ? "Available" : "Rented"}
                </span>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>
                  ⭐ {eq.rating > 0 ? eq.rating.toFixed(1) : "—"}
                </div>
              </div>
            </div>
          ))}
          {myListings.length === 0 && (
            <div style={s.emptySmall}>
              No listings yet.{" "}
              <span style={{ color: "#3B6D11", cursor: "pointer" }} onClick={() => navigate("/equipment/new")}>
                List your equipment
              </span>{" "}
              to earn extra income!
            </div>
          )}
        </div>

        {/* Recent rentals */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div style={s.cardTitle}>My Recent Rentals</div>
            <button onClick={() => navigate("/bookings")} style={s.linkBtn}>View all →</button>
          </div>
          {myBookings.slice(0, 4).map((b, i) => {
            const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            return (
              <div key={i} className="fd-booking-row" style={s.bookingRow}>
                <div style={s.bookingInfo}>
                  <div style={s.bookingName}>{b.equipment?.name || "Equipment"}</div>
                  <div style={s.bookingMeta}>{new Date(b.fromDate).toLocaleDateString("en-IN")} → {new Date(b.toDate).toLocaleDateString("en-IN")}</div>
                </div>
                <div style={s.bookingRight}>
                  <div style={s.bookingAmt}>₹{b.totalAmount?.toLocaleString()}</div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "8px", background: st.bg, color: st.color, fontWeight: 500 }}>{b.status}</span>
                </div>
              </div>
            );
          })}
          {myBookings.length === 0 && (
            <div style={s.emptySmall}>
              No rentals yet.{" "}
              <span style={{ color: "#3B6D11", cursor: "pointer" }} onClick={() => navigate("/equipment")}>
                Browse equipment
              </span>{" "}
              to get started!
            </div>
          )}
        </div>
      </div>

      {/* Quick links — desktop position (hidden on mobile via CSS, shown above instead) */}
      <div className="fd-quick-grid" style={s.quickGrid}>
        {[
          { icon: "🤖", label: "AI Crop Advice",   path: "/ai-advisor", color: "#EAF3DE" },
          { icon: "⛅", label: "Weather Forecast",  path: "/weather",    color: "#E1F5EE" },
          { icon: "📋", label: "All My Bookings",   path: "/bookings",   color: "#EEEDFE" },
          { icon: "👤", label: "Edit My Profile",   path: "/profile",    color: "#FAEEDA" },
        ].map((item) => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="fd-quick-btn"
            style={{ ...s.quickBtn, background: item.color }}>
            <span style={{ fontSize: "22px" }}>{item.icon}</span>
            <span style={s.quickLabel}>{item.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

const s = {
  page:        { padding: "2rem", maxWidth: "1100px", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" },
  welcome:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" },
  title:       { fontFamily: "'DM Serif Display', serif", fontSize: "26px", margin: "0 0 4px" },
  sub:         { fontSize: "13px", color: "#888", margin: 0 },
  headerBtns:  { display: "flex", gap: "10px" },
  primaryBtn:  { padding: "9px 18px", borderRadius: "8px", border: "none", background: "#3B6D11", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  outlineBtn:  { padding: "9px 18px", borderRadius: "8px", border: "0.5px solid #97C459", background: "#EAF3DE", color: "#27500A", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  statGrid:    { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: "12px", marginBottom: "4px" },
  statCard:    { background: "white", borderRadius: "10px", border: "0.5px solid #E8E6E0", padding: "1rem" },
  statTop:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  statLabel:   { fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  statVal:     { fontSize: "22px", fontWeight: 500, marginBottom: "4px" },
  statSub:     { fontSize: "11px", color: "#AAA" },
  grid2:       { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "14px", marginBottom: "14px" },
  card:        { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "1.1rem 1.25rem" },
  cardHead:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  cardTitle:   { fontSize: "14px", fontWeight: 500 },
  cardSub:     { fontSize: "12px", color: "#3B6D11", fontWeight: 500 },
  linkBtn:     { fontSize: "12px", color: "#3B6D11", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" },
  bookingRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #F0EEE9" },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: "13px", fontWeight: 500, marginBottom: "2px" },
  bookingMeta: { fontSize: "11px", color: "#888" },
  bookingRight:{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" },
  bookingAmt:  { fontSize: "13px", fontWeight: 500, color: "#3B6D11" },
  respondBtn:  { padding: "3px 10px", borderRadius: "6px", border: "none", background: "#3B6D11", color: "white", fontSize: "10px", cursor: "pointer", fontFamily: "inherit" },
  listingRow:  { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "0.5px solid #F0EEE9", cursor: "pointer" },
  listingIcon: { fontSize: "20px", width: "32px", height: "32px", background: "#EAF3DE", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  listingInfo: { flex: 1 },
  listingName: { fontSize: "13px", fontWeight: 500, marginBottom: "2px" },
  listingMeta: { fontSize: "11px", color: "#888" },
  listingRight:{ display: "flex", flexDirection: "column", alignItems: "flex-end" },
  emptySmall:  { padding: "1rem 0", fontSize: "13px", color: "#888", textAlign: "center" },
  quickGrid:   { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "12px", marginTop: "4px" },
  quickBtn:    { padding: "1rem", borderRadius: "12px", border: "0.5px solid #E8E6E0", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all .15s" },
  quickLabel:  { fontSize: "13px", fontWeight: 500, color: "#1a1a1a" },
  center:      { textAlign: "center", padding: "4rem", color: "#888", fontFamily: "'DM Sans', sans-serif" },
};