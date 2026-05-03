import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";
import AdminVendors from "./AdminVendors";
import AdminUsers from "./AdminUsers";
import AdminListings from "./AdminListings";
import AdminTransactions from "./AdminTransactions";

const TABS = [
  { id: "overview",     label: "Overview",       icon: "📊" },
  { id: "vendors",      label: "Vendor Approvals", icon: "🏪" },
  { id: "users",        label: "Users",            icon: "👥" },
  { id: "listings",     label: "Listings",         icon: "📋" },
  { id: "transactions", label: "Transactions",     icon: "💳" },
];

function StatCard({ label, value, sub, color }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statVal, color: color || "var(--color-text-primary)" }}>{value}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  );
}

function OverviewTab({ stats }) {
  if (!stats) return <div style={s.center}>Loading stats…</div>;
  return (
    <div>
      <div style={s.sectionTitle}>Platform Overview</div>
      <div style={s.statGrid}>
        <StatCard label="Total Users"       value={stats.users?.total?.toLocaleString()}   sub={`${stats.users?.farmers} farmers · ${stats.users?.vendors} vendors`} />
        <StatCard label="Pending Vendors"   value={stats.users?.pendingVendors}            sub="Awaiting approval" color={stats.users?.pendingVendors > 0 ? "#A32D2D" : "#3B6D11"} />
        <StatCard label="Equipment Listed"  value={stats.equipment?.toLocaleString()}      sub="Active listings" />
        <StatCard label="Total Bookings"    value={stats.bookings?.toLocaleString()}       sub="All time" />
        <StatCard label="Products Listed"   value={stats.products?.toLocaleString()}       sub="Active products" />
      </div>

      <div style={s.sectionTitle}>Recent Bookings</div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Renter", "Equipment", "Amount", "Status", "Date"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(stats.recentBookings || []).map((b, i) => (
              <tr key={i} style={s.tr}>
                <td style={s.td}>{b.renter?.name || "—"}</td>
                <td style={s.td}>{b.equipment?.name || "—"}</td>
                <td style={s.td}>₹{b.totalAmount?.toLocaleString()}</td>
                <td style={s.td}><span style={{ ...s.pill, ...STATUS_STYLE[b.status] }}>{b.status}</span></td>
                <td style={s.td}>{new Date(b.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {!stats.recentBookings?.length && (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#888" }}>No bookings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  pending:   { background: "#FAEEDA", color: "#633806" },
  confirmed: { background: "#EAF3DE", color: "#27500A" },
  cancelled: { background: "#FCEBEB", color: "#791F1F" },
  completed: { background: "#E1F5EE", color: "#085041" },
};

export default function AdminPage() {
  const { authFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats]         = useState(null);
  const [pendingCount, setPending] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data);
          setPending(data.users?.pendingVendors || 0);
        }
      } catch {}
    };
    load();
  }, []);

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideHeader}>
          <div style={s.adminBadge}>Admin Panel</div>
          <div style={s.adminName}>{user?.name}</div>
        </div>
        <nav style={s.sideNav}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ ...s.sideBtn, ...(activeTab === tab.id ? s.sideBtnActive : {}) }}
            >
              <span style={{ fontSize: "16px" }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "vendors" && pendingCount > 0 && (
                <span style={s.pendingBadge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {activeTab === "overview"     && <OverviewTab stats={stats} />}
        {activeTab === "vendors"      && <AdminVendors onApproval={() => setPending(p => Math.max(0, p - 1))} />}
        {activeTab === "users"        && <AdminUsers />}
        {activeTab === "listings"     && <AdminListings />}
        {activeTab === "transactions" && <AdminTransactions />}
      </main>
    </div>
  );
}

const s = {
  page:         { display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)", fontFamily: "'DM Sans', sans-serif" },
  sidebar:      { background: "white", borderRight: "0.5px solid #E8E6E0", display: "flex", flexDirection: "column" },
  sideHeader:   { padding: "1.25rem", borderBottom: "0.5px solid #E8E6E0" },
  adminBadge:   { fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: "6px", background: "#EEEDFE", color: "#3C3489", display: "inline-block", marginBottom: "6px" },
  adminName:    { fontSize: "13px", fontWeight: 500, color: "#1a1a1a" },
  sideNav:      { padding: "10px 8px", display: "flex", flexDirection: "column", gap: "2px" },
  sideBtn:      { display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", border: "none", background: "transparent", fontSize: "13px", cursor: "pointer", color: "#888", fontFamily: "inherit", textAlign: "left", transition: "all .15s" },
  sideBtnActive:{ background: "#EEEDFE", color: "#3C3489", fontWeight: 500 },
  pendingBadge: { marginLeft: "auto", background: "#E24B4A", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "8px", fontWeight: 500 },
  main:         { padding: "1.75rem", background: "#F7F6F3", overflowY: "auto" },
  sectionTitle: { fontSize: "15px", fontWeight: 500, marginBottom: "1rem", color: "#1a1a1a" },
  statGrid:     { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: "12px", marginBottom: "1.75rem" },
  statCard:     { background: "white", borderRadius: "10px", border: "0.5px solid #E8E6E0", padding: "1rem" },
  statLabel:    { fontSize: "11px", color: "#888", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" },
  statVal:      { fontSize: "22px", fontWeight: 500, marginBottom: "4px" },
  statSub:      { fontSize: "11px", color: "#AAA" },
  tableWrap:    { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", overflow: "hidden" },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { padding: "10px 14px", fontSize: "11px", fontWeight: 500, color: "#888", textAlign: "left", background: "#F7F6F3", borderBottom: "0.5px solid #E8E6E0", textTransform: "uppercase", letterSpacing: "0.05em" },
  tr:           { borderBottom: "0.5px solid #F0EEE9" },
  td:           { padding: "11px 14px", fontSize: "13px", color: "#444" },
  pill:         { fontSize: "10px", padding: "3px 8px", borderRadius: "8px", fontWeight: 500, textTransform: "capitalize" },
  center:       { textAlign: "center", padding: "3rem", color: "#888" },
};
