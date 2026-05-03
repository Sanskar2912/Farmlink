import { useNavigate } from "react-router-dom";

const CATEGORY_ICONS = {
  tractor:"🚜", harvester:"🌾", sprayer:"💧", seeder:"🌱", pump:"⛽", tiller:"🔧", other:"⚙️",
};

export default function EquipmentCard({ equipment }) {
  const navigate = useNavigate();
  const icon  = CATEGORY_ICONS[equipment.category] || "⚙️";
  const isP2P = equipment.ownerType === "farmer";

  return (
    <div style={s.card} onClick={() => navigate(`/equipment/${equipment._id}`)}>
      {/* CHANGE 2 — uses single `image` field instead of `images[0]` */}
      <div style={s.imgBox}>
        {equipment.image
          ? <img src={equipment.image} alt={equipment.name} style={s.img} />
          : <span style={{ fontSize:"36px" }}>{icon}</span>
        }
        <span style={{ ...s.badge, ...(isP2P ? s.badgeP2P : s.badgeVendor) }}>
          {isP2P ? "P2P" : "Vendor"}
        </span>
      </div>

      <div style={s.info}>
        <div style={s.name}>{equipment.name}</div>
        <div style={s.price}>₹{equipment.pricePerDay.toLocaleString()} <span style={s.perDay}>/ day</span></div>
        <div style={s.meta}>
          <span>📍 {equipment.city || "N/A"}</span>
          <span>{equipment.rating > 0 ? `⭐ ${equipment.rating.toFixed(1)} (${equipment.totalReviews})` : "No reviews yet"}</span>
        </div>
        <div style={s.owner}>By {equipment.owner?.shopName || equipment.owner?.name || "Unknown"}</div>
        <div style={s.footer}>
          <span style={{ ...s.availBadge, ...(equipment.isAvailable ? s.availYes : s.availNo) }}>
            <span style={s.dot} />
            {equipment.isAvailable ? "Available" : "Unavailable"}
          </span>
          <button
            style={{ ...s.rentBtn, ...(equipment.isAvailable ? {} : s.rentBtnDisabled) }}
            disabled={!equipment.isAvailable}
            onClick={(e) => { e.stopPropagation(); navigate(`/equipment/${equipment._id}`); }}
          >
            {equipment.isAvailable ? "Rent Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:           { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", overflow:"hidden", cursor:"pointer", fontFamily:"'DM Sans', sans-serif" },
  imgBox:         { height:"140px", background:"#EAF3DE", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" },
  img:            { width:"100%", height:"100%", objectFit:"cover" },
  badge:          { position:"absolute", top:"8px", right:"8px", fontSize:"10px", fontWeight:500, padding:"3px 8px", borderRadius:"8px" },
  badgeVendor:    { background:"#E1F5EE", color:"#085041" },
  badgeP2P:       { background:"#EEEDFE", color:"#3C3489" },
  info:           { padding:"12px 14px" },
  name:           { fontSize:"14px", fontWeight:500, marginBottom:"4px" },
  price:          { fontSize:"16px", fontWeight:500, color:"#3B6D11", marginBottom:"8px" },
  perDay:         { fontSize:"12px", fontWeight:400, color:"#888" },
  meta:           { display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#888", marginBottom:"6px" },
  owner:          { fontSize:"11px", color:"#888", marginBottom:"10px" },
  footer:         { display:"flex", alignItems:"center", justifyContent:"space-between" },
  availBadge:     { fontSize:"10px", display:"flex", alignItems:"center", gap:"4px", padding:"3px 8px", borderRadius:"8px" },
  availYes:       { background:"#EAF3DE", color:"#27500A" },
  availNo:        { background:"#F0EEE9", color:"#888" },
  dot:            { width:"5px", height:"5px", borderRadius:"50%", background:"currentColor" },
  rentBtn:        { padding:"6px 14px", borderRadius:"6px", border:"none", background:"#3B6D11", color:"white", fontSize:"11px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  rentBtnDisabled:{ background:"#DDD", color:"#888", cursor:"not-allowed" },
};
