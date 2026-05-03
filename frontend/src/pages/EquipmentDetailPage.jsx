import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const CATEGORY_ICONS = { tractor:"🚜", harvester:"🌾", sprayer:"💧", seeder:"🌱", pump:"⛽", tiller:"🔧", other:"⚙️" };
const CATEGORIES = ["tractor","harvester","sprayer","seeder","pump","tiller","other"];
const STATES     = ["Uttar Pradesh","Maharashtra","Punjab","Haryana","Madhya Pradesh","Rajasthan","Bihar","Gujarat","Karnataka","Tamil Nadu","Other"];

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

export default function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const isMobile = useIsMobile();

  const [equipment, setEquipment]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [avail, setAvail]             = useState(null);
  const [checkingAvail, setChecking]  = useState(false);

  const [booking, setBooking]         = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingErr, setBookingErr]   = useState("");

  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch(`/api/equipment/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setEquipment(data.equipment);
      } catch (err) {
        setError(err.message || "Equipment not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const checkAvailability = async () => {
    if (!fromDate || !toDate) return;
    setChecking(true); setAvail(null);
    try {
      const res  = await authFetch(`/api/equipment/${id}/availability?from=${fromDate}&to=${toDate}`);
      const data = await res.json();
      setAvail(data);
    } catch {
      setAvail({ available: false, message: "Could not check availability." });
    } finally { setChecking(false); }
  };

  const handleBook = async () => {
    if (!avail?.available) return;
    setBooking(true); setBookingErr("");
    try {
      const res  = await authFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ equipmentId: id, fromDate, toDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBookingDone(true);
    } catch (err) {
      setBookingErr(err.message || "Booking failed. Try again.");
    } finally { setBooking(false); }
  };

  const openEdit = () => {
    setEditForm({
      name:        equipment.name,
      description: equipment.description || "",
      category:    equipment.category,
      pricePerDay: equipment.pricePerDay,
      city:        equipment.city || "",
      state:       equipment.state || "Uttar Pradesh",
      pincode:     equipment.pincode || "",
      isAvailable: equipment.isAvailable,
    });
    setEditError(""); setEditSuccess(false); setEditing(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim())   { setEditError("Equipment name is required."); return; }
    if (!editForm.pricePerDay || isNaN(editForm.pricePerDay) || Number(editForm.pricePerDay) < 1) {
      setEditError("Enter a valid price (min ₹1)."); return;
    }
    if (!editForm.city.trim())   { setEditError("City is required."); return; }
    setEditSaving(true); setEditError("");
    try {
      const res  = await authFetch(`/api/equipment/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...editForm, pricePerDay: Number(editForm.pricePerDay) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEquipment(data.equipment);
      setEditSuccess(true);
      setTimeout(() => { setEditing(false); setEditSuccess(false); }, 1200);
    } catch (err) {
      setEditError(err.message || "Update failed.");
    } finally { setEditSaving(false); }
  };

  const setEdit = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setEditForm(f => ({ ...f, [key]: val }));
    setEditError("");
  };

  const isOwner = user && equipment && equipment.owner?._id === user._id;
  const today   = new Date().toISOString().split("T")[0];

  if (loading) return <div style={s.center}>Loading…</div>;
  if (error)   return (
    <div style={s.errFull}>
      {error}
      <button onClick={() => navigate(-1)} style={s.backBtn}>Go back</button>
    </div>
  );

  // ── Booking panel — shared between desktop sidebar & mobile bottom section ──
  const BookingPanel = () => (
    bookingDone ? (
      <div style={s.successBox}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>✅</div>
        <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>Booking Request Sent!</div>
        <div style={{ fontSize: "13px", color: "#555", marginBottom: "20px" }}>
          The owner will confirm your booking. You'll see it in My Bookings.
        </div>
        <button onClick={() => navigate("/bookings")} style={s.primaryBtn}>View My Bookings</button>
      </div>
    ) : (
      <div style={s.card}>
        <div style={s.panelTitle}>Check Availability & Book</div>
        {isOwner && (
          <div style={s.ownerNote}>This is your listing. You cannot book your own equipment.</div>
        )}
        {!isOwner && (
          <>
            <div style={s.fieldGroup}>
              <label style={s.label}>From date</label>
              <input type="date" min={today} value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setAvail(null); }}
                style={s.input} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>To date</label>
              <input type="date" min={fromDate || today} value={toDate}
                onChange={(e) => { setToDate(e.target.value); setAvail(null); }}
                style={s.input} />
            </div>
            <button
              onClick={checkAvailability}
              disabled={!fromDate || !toDate || checkingAvail}
              style={{ ...s.checkBtn, opacity: (!fromDate || !toDate) ? 0.5 : 1 }}
            >
              {checkingAvail ? "Checking…" : "Check Availability"}
            </button>
            {avail && (
              <div style={{ ...s.availBox, ...(avail.available ? s.availGreen : s.availRed) }}>
                <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                  {avail.available ? "✅ Available!" : "❌ Not Available"}
                </div>
                <div style={{ fontSize: "12px" }}>{avail.message}</div>
                {avail.available && (
                  <div style={s.summary}>
                    <div style={s.summaryRow}><span>Duration</span><span>{avail.totalDays} day{avail.totalDays > 1 ? "s" : ""}</span></div>
                    <div style={s.summaryRow}><span>Rate</span><span>₹{equipment.pricePerDay.toLocaleString()}/day</span></div>
                    <div style={{ ...s.summaryRow, fontWeight: 500, borderTop: "0.5px solid rgba(0,0,0,0.1)", paddingTop: "8px", marginTop: "4px" }}>
                      <span>Total</span><span>₹{avail.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {bookingErr && <div style={s.errBox}>{bookingErr}</div>}
            <button
              onClick={handleBook}
              disabled={!avail?.available || booking}
              style={{ ...s.primaryBtn, marginTop: "12px", opacity: (!avail?.available || booking) ? 0.5 : 1, cursor: (!avail?.available || booking) ? "not-allowed" : "pointer" }}
            >
              {booking ? "Booking…" : "Confirm Booking Request"}
            </button>
            <p style={s.note}>Payment is collected after the owner confirms your request.</p>
          </>
        )}
      </div>
    )
  );

  return (
    <div style={{ ...s.page, padding: isMobile ? "1rem" : "2rem" }}>
      <button onClick={() => navigate(-1)} style={s.backLink}>← Back to listings</button>

      <div style={{ ...s.layout, gridTemplateColumns: isMobile ? "1fr" : "1fr 380px" }}>

        {/* LEFT — Equipment info */}
        <div style={s.left}>
          <div style={{ ...s.imgBox, height: isMobile ? "200px" : "220px" }}>
            {equipment.image
              ? <img src={equipment.image} alt={equipment.name} style={s.img} />
              : <span style={{ fontSize: "64px" }}>{CATEGORY_ICONS[equipment.category] || "⚙️"}</span>
            }
            <span style={{ ...s.badge, ...(equipment.ownerType === "farmer" ? s.badgeP2P : s.badgeVendor) }}>
              {equipment.ownerType === "farmer" ? "P2P Listing" : "Vendor"}
            </span>
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
              <h1 style={{ ...s.name, marginBottom: 0, flex: 1, minWidth: 0 }}>{equipment.name}</h1>
              {isOwner && (
                <button onClick={openEdit} style={s.editBtn}>✏️ Edit Listing</button>
              )}
            </div>
            <div style={s.price}>₹{equipment.pricePerDay.toLocaleString()} <span style={s.perDay}>per day</span></div>

            {equipment.description && <p style={s.desc}>{equipment.description}</p>}

            <div style={{ ...s.metaGrid, gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr" }}>
              <div style={s.metaItem}><span style={s.metaLabel}>Category</span><span style={s.metaVal}>{equipment.category}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Location</span><span style={s.metaVal}>{equipment.city}, {equipment.state}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Rating</span><span style={s.metaVal}>{equipment.rating > 0 ? `⭐ ${equipment.rating.toFixed(1)} (${equipment.totalReviews} reviews)` : "No reviews yet"}</span></div>
              <div style={s.metaItem}><span style={s.metaLabel}>Status</span><span style={{ ...s.metaVal, color: equipment.isAvailable ? "#3B6D11" : "#A32D2D" }}>{equipment.isAvailable ? "Available" : "Currently rented"}</span></div>
            </div>

            <div style={s.ownerBox}>
              <div style={s.ownerAvatar}>{(equipment.owner?.name || "?")[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>{equipment.owner?.shopName || equipment.owner?.name}</div>
                <div style={{ fontSize: "11px", color: "#888" }}>{equipment.ownerType === "vendor" ? "Verified Vendor" : "Farmer"} · {equipment.city}</div>
              </div>
            </div>
          </div>

          {/* Edit panel */}
          {isOwner && editing && (
            <div style={s.editCard}>
              <div style={s.editHeader}>
                <div style={s.editTitle}>Edit Listing</div>
                <button onClick={() => setEditing(false)} style={s.closeBtn}>✕</button>
              </div>

              <div style={s.editSection}>Basic Information</div>
              <div style={s.editField}>
                <label style={s.editLabel}>Equipment name <span style={{ color: "#D85A30" }}>*</span></label>
                <input style={s.editInput} value={editForm.name} onChange={setEdit("name")} placeholder="e.g. Mahindra 265 DI Tractor" />
              </div>
              <div style={s.editField}>
                <label style={s.editLabel}>Category</label>
                <select style={s.editInput} value={editForm.category} onChange={setEdit("category")}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div style={s.editField}>
                <label style={s.editLabel}>Description</label>
                <textarea style={{ ...s.editInput, height: "72px", resize: "vertical" }}
                  value={editForm.description} onChange={setEdit("description")}
                  placeholder="Condition, model year, features…" />
              </div>

              <div style={s.editSection}>Pricing</div>
              <div style={s.editField}>
                <label style={s.editLabel}>Price per day (₹) <span style={{ color: "#D85A30" }}>*</span></label>
                <input style={s.editInput} type="number" value={editForm.pricePerDay} onChange={setEdit("pricePerDay")} placeholder="e.g. 1500" />
              </div>

              <div style={s.editSection}>Location</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                <div style={s.editField}>
                  <label style={s.editLabel}>City <span style={{ color: "#D85A30" }}>*</span></label>
                  <input style={s.editInput} value={editForm.city} onChange={setEdit("city")} placeholder="e.g. Lucknow" />
                </div>
                <div style={s.editField}>
                  <label style={s.editLabel}>Pincode</label>
                  <input style={s.editInput} value={editForm.pincode} onChange={setEdit("pincode")} placeholder="e.g. 226001" />
                </div>
              </div>
              <div style={s.editField}>
                <label style={s.editLabel}>State</label>
                <select style={s.editInput} value={editForm.state} onChange={setEdit("state")}>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div style={s.editSection}>Availability</div>
              <label style={s.toggleRow}>
                <input type="checkbox" checked={editForm.isAvailable} onChange={setEdit("isAvailable")}
                  style={{ width: "16px", height: "16px", marginRight: "8px", accentColor: "#3B6D11" }} />
                <span style={{ fontSize: "13px", color: "#333" }}>
                  Mark as <strong>{editForm.isAvailable ? "Available" : "Unavailable"}</strong> for rental
                </span>
              </label>

              {editError   && <div style={s.editErr}>{editError}</div>}
              {editSuccess && <div style={s.editSuccess}>✅ Listing updated!</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
                <button onClick={() => setEditing(false)} style={s.cancelBtn}>Cancel</button>
                <button onClick={handleEditSave} disabled={editSaving}
                  style={{ ...s.saveBtn, opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* On mobile: booking panel flows inline here, below equipment info */}
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <BookingPanel />
              {equipment.bookedDates?.length > 0 && <BookedDatesCard equipment={equipment} />}
            </div>
          )}
        </div>

        {/* RIGHT — Desktop only sidebar */}
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <BookingPanel />
            {equipment.bookedDates?.length > 0 && <BookedDatesCard equipment={equipment} />}
          </div>
        )}
      </div>
    </div>
  );
}

function BookedDatesCard({ equipment }) {
  return (
    <div style={{ ...s.card, marginTop: 0 }}>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "10px" }}>Already booked dates</div>
      {equipment.bookedDates.map((d, i) => (
        <div key={i} style={s.bookedRow}>
          <span style={s.bookedDot} />
          {new Date(d.from).toLocaleDateString("en-IN")} → {new Date(d.to).toLocaleDateString("en-IN")}
        </div>
      ))}
    </div>
  );
}

const s = {
  page:        { maxWidth: "1000px", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" },
  backLink:    { fontSize: "13px", color: "#3B6D11", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "1.25rem", display: "block" },
  layout:      { display: "grid", gap: "20px", alignItems: "start" },
  left:        { display: "flex", flexDirection: "column", gap: "16px" },
  imgBox:      { background: "#EAF3DE", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  img:         { width: "100%", height: "100%", objectFit: "cover" },
  badge:       { position: "absolute", top: "10px", right: "10px", fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "8px" },
  badgeVendor: { background: "#E1F5EE", color: "#085041" },
  badgeP2P:    { background: "#EEEDFE", color: "#3C3489" },
  card:        { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "1.25rem" },
  name:        { fontFamily: "'DM Serif Display', serif", fontSize: "22px", margin: "0 0 6px" },
  price:       { fontSize: "22px", fontWeight: 500, color: "#3B6D11", marginBottom: "12px" },
  perDay:      { fontSize: "14px", fontWeight: 400, color: "#888" },
  desc:        { fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "16px" },
  metaGrid:    { display: "grid", gap: "12px", marginBottom: "16px" },
  metaItem:    { display: "flex", flexDirection: "column", gap: "2px" },
  metaLabel:   { fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" },
  metaVal:     { fontSize: "13px", fontWeight: 500, textTransform: "capitalize" },
  ownerBox:    { display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#F7F6F3", borderRadius: "8px" },
  ownerAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#EAF3DE", color: "#27500A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: "14px", flexShrink: 0 },
  panelTitle:  { fontSize: "15px", fontWeight: 500, marginBottom: "16px" },
  fieldGroup:  { marginBottom: "12px" },
  label:       { display: "block", fontSize: "11px", fontWeight: 500, color: "#555", marginBottom: "5px" },
  input:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  checkBtn:    { width: "100%", padding: "10px", borderRadius: "8px", border: "0.5px solid #97C459", background: "#EAF3DE", color: "#27500A", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginBottom: "12px" },
  availBox:    { borderRadius: "8px", padding: "12px", marginBottom: "8px", fontSize: "13px" },
  availGreen:  { background: "#EAF3DE", color: "#27500A" },
  availRed:    { background: "#FCEBEB", color: "#791F1F" },
  summary:     { marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" },
  summaryRow:  { display: "flex", justifyContent: "space-between", fontSize: "13px" },
  primaryBtn:  { width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#3B6D11", color: "white", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  note:        { fontSize: "11px", color: "#AAA", textAlign: "center", marginTop: "8px" },
  errBox:      { background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#791F1F", marginBottom: "8px" },
  ownerNote:   { background: "#FAEEDA", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#633806", marginBottom: "12px" },
  successBox:  { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", padding: "2rem", textAlign: "center" },
  bookedRow:   { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#555", padding: "5px 0", borderBottom: "0.5px solid #F0EEE9" },
  bookedDot:   { width: "6px", height: "6px", borderRadius: "50%", background: "#D85A30", flexShrink: 0 },
  center:      { textAlign: "center", padding: "4rem", color: "#888" },
  errFull:     { textAlign: "center", padding: "4rem", color: "#A32D2D" },
  backBtn:     { marginTop: "12px", padding: "8px 16px", borderRadius: "8px", border: "0.5px solid #DDD", background: "white", cursor: "pointer", fontSize: "13px", display: "block", margin: "12px auto 0" },
  editBtn:     { padding: "6px 14px", borderRadius: "8px", border: "0.5px solid #97C459", background: "#EAF3DE", color: "#27500A", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },
  editCard:    { background: "white", borderRadius: "12px", border: "0.5px solid #97C459", padding: "1.25rem" },
  editHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  editTitle:   { fontSize: "15px", fontWeight: 500 },
  closeBtn:    { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#888", padding: "2px 6px" },
  editSection: { fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", margin: "1rem 0 8px", paddingBottom: "6px", borderBottom: "0.5px solid #F0EEE9" },
  editField:   { marginBottom: "10px" },
  editLabel:   { display: "block", fontSize: "12px", fontWeight: 500, color: "#555", marginBottom: "4px" },
  editInput:   { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "white" },
  toggleRow:   { display: "flex", alignItems: "center", padding: "10px 12px", background: "#F7F6F3", borderRadius: "8px", cursor: "pointer", marginBottom: "4px" },
  editErr:     { background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#791F1F", marginTop: "10px" },
  editSuccess: { background: "#EAF3DE", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#27500A", marginTop: "10px", textAlign: "center" },
  cancelBtn:   { flex: 1, padding: "10px", borderRadius: "8px", border: "0.5px solid #DDD", background: "white", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" },
  saveBtn:     { flex: 2, padding: "10px", borderRadius: "8px", border: "none", background: "#3B6D11", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
};