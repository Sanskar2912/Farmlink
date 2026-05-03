import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/AuthContext";
import EquipmentCard from "../components/EquipmentCard";

export default function EquipmentPage() {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filters, setFilters]     = useState({ search:"", category:"", city:"", ownerType:"" });

  const CATEGORIES = [
    { value:"",          label: t("equipment.allTypes") },
    { value:"tractor",   label: t("equipment.cat_tractor") },
    { value:"harvester", label: t("equipment.cat_harvester") },
    { value:"sprayer",   label: t("equipment.cat_sprayer") },
    { value:"seeder",    label: t("equipment.cat_seeder") },
    { value:"pump",      label: t("equipment.cat_pump") },
    { value:"tiller",    label: t("equipment.cat_tiller") },
    { value:"other",     label: t("equipment.cat_other") },
  ];

  const fetchEquipment = async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (filters.search)    params.append("search",    filters.search);
      if (filters.category)  params.append("category",  filters.category);
      if (filters.city)      params.append("city",      filters.city);
      if (filters.ownerType) params.append("ownerType", filters.ownerType);
      const res  = await authFetch(`/api/equipment?${params}`);
      const data = await res.json();
      setEquipment(data.equipment || []);
    } catch {
      setError(t("equipment.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEquipment(); }, []);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{t("equipment.title")}</h1>
          <p style={s.sub}>{t("equipment.subtitle")}</p>
        </div>
        <a href="/equipment/new" style={s.addBtn}>{t("equipment.listYours")}</a>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchEquipment(); }} style={s.filterBar}>
        <input style={s.searchInput} placeholder={t("equipment.searchPlaceholder")}
          value={filters.search} onChange={e => setFilter("search", e.target.value)} />
        <select style={s.select} value={filters.category} onChange={e => setFilter("category", e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input style={{ ...s.searchInput, maxWidth:"160px" }} placeholder={t("common.city")}
          value={filters.city} onChange={e => setFilter("city", e.target.value)} />
        <select style={s.select} value={filters.ownerType} onChange={e => setFilter("ownerType", e.target.value)}>
          <option value="">{t("equipment.allOwners")}</option>
          <option value="vendor">{t("equipment.vendorsOnly")}</option>
          <option value="farmer">{t("equipment.farmersP2P")}</option>
        </select>
        <button type="submit" style={s.searchBtn}>{t("equipment.search")}</button>
      </form>

      {loading && <div style={s.center}>{t("common.loading")}</div>}
      {error   && <div style={s.errBox}>{error}</div>}

      {!loading && !error && equipment.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
          <div style={{ fontWeight:500, marginBottom:"6px" }}>{t("equipment.noEquipment")}</div>
          <div style={{ fontSize:"13px", color:"#888" }}>{t("equipment.noEquipmentSub")}</div>
        </div>
      )}

      {!loading && (
        <div style={s.grid}>
          {equipment.map(eq => <EquipmentCard key={eq._id} equipment={eq} />)}
        </div>
      )}
    </div>
  );
}

const s = {
  page:        { padding:"2rem", maxWidth:"1100px", margin:"0 auto" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem", flexWrap:"wrap", gap:"12px" },
  title:       { fontFamily:"'DM Serif Display', serif", fontSize:"26px", margin:0 },
  sub:         { fontSize:"13px", color:"#888", margin:"4px 0 0" },
  addBtn:      { padding:"10px 18px", borderRadius:"8px", background:"#3B6D11", color:"white", textDecoration:"none", fontSize:"13px", fontWeight:500, whiteSpace:"nowrap" },
  filterBar:   { display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"1.5rem", background:"white", padding:"14px", borderRadius:"12px", border:"0.5px solid #E8E6E0" },
  searchInput: { flex:1, minWidth:"160px", padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", outline:"none" },
  select:      { padding:"9px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", background:"white", outline:"none", cursor:"pointer" },
  searchBtn:   { padding:"9px 20px", borderRadius:"8px", border:"none", background:"#3B6D11", color:"white", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  grid:        { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:"16px" },
  center:      { textAlign:"center", padding:"3rem", color:"#888", fontSize:"14px" },
  errBox:      { background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:"8px", padding:"12px 16px", color:"#791F1F", fontSize:"13px", marginBottom:"1rem" },
  empty:       { textAlign:"center", padding:"4rem 2rem", color:"#888" },
};
