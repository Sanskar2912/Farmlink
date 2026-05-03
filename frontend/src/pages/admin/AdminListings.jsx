import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

const CATEGORY_ICONS = { tractor:"🚜", harvester:"🌾", sprayer:"💧", seeder:"🌱", pump:"⛽", tiller:"🔧", other:"⚙️" };

export default function AdminListings() {
  const { authFetch }   = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [ownerType, setOwnerType] = useState("");
  const [removing, setRemoving] = useState(null);
  const [toast, setToast]       = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.append("search",    search);
      if (ownerType) params.append("ownerType", ownerType);
      const res  = await authFetch(`/api/equipment?${params}`);
      const data = await res.json();
      setListings(data.equipment || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove listing "${name}"? This cannot be undone.`)) return;
    setRemoving(id);
    try {
      const res  = await authFetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      load();
    } catch (err) {
      showToast(err.message || "Failed to remove.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={s.header}>
        <div style={s.title}>Equipment Listings ({listings.length})</div>
        <div style={s.filters}>
          <input style={s.searchInput} placeholder="Search listings…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()} />
          <select style={s.select} value={ownerType} onChange={(e) => setOwnerType(e.target.value)}>
            <option value="">All Owners</option>
            <option value="vendor">Vendor listings</option>
            <option value="farmer">Farmer P2P</option>
          </select>
          <button onClick={load} style={s.searchBtn}>Search</button>
        </div>
      </div>

      {loading && <div style={s.center}>Loading listings…</div>}

      {!loading && (
        <div style={s.grid}>
          {listings.map((eq) => (
            <div key={eq._id} style={s.card}>
              <div style={s.cardImg}>
                {eq.images?.[0]
                  ? <img src={eq.images[0]} alt={eq.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize: "28px" }}>{CATEGORY_ICONS[eq.category] || "⚙️"}</span>
                }
                <span style={{ ...s.typeBadge, ...(eq.ownerType === "farmer" ? s.p2p : s.vendorBadge) }}>
                  {eq.ownerType === "farmer" ? "P2P" : "Vendor"}
                </span>
              </div>
              <div style={s.cardBody}>
                <div style={s.listingName}>{eq.name}</div>
                <div style={s.listingMeta}>
                  <span>₹{eq.pricePerDay?.toLocaleString()}/day</span>
                  <span>📍 {eq.city}</span>
                </div>
                <div style={s.ownerRow}>
                  By: <strong>{eq.owner?.shopName || eq.owner?.name || "—"}</strong>
                </div>
                <div style={s.ratingRow}>
                  {eq.rating > 0 ? `⭐ ${eq.rating.toFixed(1)} (${eq.totalReviews})` : "No reviews"}
                  <span style={{ ...s.availPill, ...(eq.isAvailable ? s.availY : s.availN) }}>
                    {eq.isAvailable ? "Available" : "Rented"}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(eq._id, eq.name)}
                  disabled={removing === eq._id}
                  style={s.removeBtn}
                >
                  {removing === eq._id ? "Removing…" : "Remove Listing"}
                </button>
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <div style={{ ...s.center, gridColumn: "1/-1" }}>No listings found.</div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  header:      { marginBottom: "1.25rem" },
  title:       { fontSize: "15px", fontWeight: 500, marginBottom: "12px" },
  filters:     { display: "flex", gap: "10px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "180px", padding: "8px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", outline: "none" },
  select:      { padding: "8px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", background: "white", outline: "none" },
  searchBtn:   { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#534AB7", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" },
  card:        { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", overflow: "hidden" },
  cardImg:     { height: "100px", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  typeBadge:   { position: "absolute", top: "6px", right: "6px", fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "6px" },
  p2p:         { background: "#EEEDFE", color: "#3C3489" },
  vendorBadge: { background: "#E1F5EE", color: "#085041" },
  cardBody:    { padding: "10px 12px" },
  listingName: { fontSize: "13px", fontWeight: 500, marginBottom: "4px" },
  listingMeta: { display: "flex", gap: "10px", fontSize: "11px", color: "#888", marginBottom: "4px" },
  ownerRow:    { fontSize: "11px", color: "#888", marginBottom: "4px" },
  ratingRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#888", marginBottom: "10px" },
  availPill:   { fontSize: "10px", padding: "2px 7px", borderRadius: "6px", fontWeight: 500 },
  availY:      { background: "#EAF3DE", color: "#27500A" },
  availN:      { background: "#FAEEDA", color: "#633806" },
  removeBtn:   { width: "100%", padding: "7px", borderRadius: "6px", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#791F1F", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  center:      { textAlign: "center", padding: "3rem", color: "#888" },
  toast:       { position: "fixed", bottom: "24px", right: "24px", background: "#1C3A0E", color: "white", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", zIndex: 999 },
};
