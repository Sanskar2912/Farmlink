import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/AuthContext";

const STATUS_STYLE = {
  pending:    { bg:"#FAEEDA", color:"#633806" },
  confirmed:  { bg:"#EAF3DE", color:"#27500A" },
  cancelled:  { bg:"#FCEBEB", color:"#791F1F" },
  completed:  { bg:"#E1F5EE", color:"#085041" },
  dispatched: { bg:"#E6F1FB", color:"#0C447C" },
  returned:   { bg:"#FAEEDA", color:"#633806" },
};

// ── Star Rating Widget ─────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display:"flex", gap:"4px" }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize:"22px",
            cursor: readonly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#F5A623" : "#DDD",
            transition:"color 0.1s",
            lineHeight:1,
          }}
        >★</span>
      ))}
    </div>
  );
}

// ── Review Form (inline, below completed booking) ──────────────────────────
function ReviewForm({ booking, onSubmitted }) {
  const { authFetch } = useAuth();
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setLoading(true); setError("");
    try {
      const res  = await authFetch(`/api/bookings/${booking._id}/review`, {
        method: "POST",
        body:   JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSubmitted();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={rs.box}>
      <div style={rs.title}>⭐ Rate your experience</div>
      <div style={rs.sub}>How was renting <strong>{booking.equipment?.name}</strong>?</div>
      <div style={{ marginBottom:"10px" }}>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <div style={rs.ratingLabel}>
            {["","Poor","Fair","Good","Very Good","Excellent"][rating]}
          </div>
        )}
      </div>
      <textarea
        style={rs.textarea}
        placeholder="Write a comment (optional)…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
      />
      {error && <div style={rs.err}>{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        style={{ ...rs.btn, opacity: (loading || rating === 0) ? 0.6 : 1 }}
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}

// ── Already reviewed display ───────────────────────────────────────────────
function ReviewDisplay({ review }) {
  return (
    <div style={rs.doneBox}>
      <div style={rs.doneTitle}>✅ Your review</div>
      <StarRating value={review.rating} readonly />
      {review.comment && <div style={rs.doneComment}>"{review.comment}"</div>}
    </div>
  );
}

// ── Booking Row ────────────────────────────────────────────────────────────
function BookingRow({ booking, onAction, incoming, onReviewSubmitted }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const eq    = booking.equipment;
  const other = incoming ? booking.renter : booking.owner;
  const st    = STATUS_STYLE[booking.status] || STATUS_STYLE.pending;

  const canReview  = !incoming && booking.status === "completed" && !booking.review?.rating;
  const hasReviewed = !incoming && booking.status === "completed" && booking.review?.rating;

  return (
    <div style={s.rowWrap}>
      <div style={s.row}>
        <div style={s.rowImg}>
          {eq?.image
            ? <img src={eq.image} alt={eq.name} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"8px" }} />
            : <span style={{ fontSize:"24px" }}>🚜</span>
          }
        </div>
        <div style={s.rowInfo}>
          <div style={s.rowName}>{eq?.name || t("bookings.equipment")}</div>
          <div style={s.rowMeta}>
            {incoming
              ? `${t("bookings.renter")}: ${other?.name}`
              : `${t("bookings.owner")}: ${other?.shopName || other?.name}`}
            {" · "}{eq?.city}
          </div>
          <div style={s.rowDates}>
            {new Date(booking.fromDate).toLocaleDateString("en-IN")} →{" "}
            {new Date(booking.toDate).toLocaleDateString("en-IN")}
            {" · "}{booking.totalDays} {t("common.days")}
          </div>
        </div>
        <div style={s.rowRight}>
          <div style={s.rowAmt}>₹{booking.totalAmount?.toLocaleString()}</div>
          <span style={{ ...s.statusBadge, background:st.bg, color:st.color }}>
            {t(`bookings.${booking.status}`) || booking.status}
          </span>
          <div style={s.rowActions}>
            {incoming && booking.status === "pending" && (
              <button style={s.btnConfirm} onClick={() => onAction(booking._id, "confirm")}>
                {t("bookings.confirm")}
              </button>
            )}
            {![" completed","cancelled"].includes(booking.status) && (
              <button style={s.btnCancel} onClick={() => onAction(booking._id, "cancel")}>
                {t("bookings.cancel")}
              </button>
            )}
            {incoming && booking.status === "confirmed" && booking.paymentStatus === "paid" && (
              <button style={s.btnDispatch} onClick={() => navigate(`/condition/${booking._id}`)}>
                📷 {t("bookings.photos")}
              </button>
            )}
            {incoming && booking.status === "returned" && (
              <button style={s.btnDispatch} onClick={() => navigate(`/condition/${booking._id}`)}>
                🔍 {t("bookings.verify")}
              </button>
            )}
            {!incoming && booking.status === "confirmed" && booking.paymentStatus !== "paid" && (
              <a href={`/pay/${booking._id}`} style={s.btnPay}>{t("bookings.payNow")}</a>
            )}
            {!incoming && ["dispatched","returned"].includes(booking.status) && (
              <button style={s.btnDispatch} onClick={() => navigate(`/condition/${booking._id}`)}>
                📷 {t("bookings.photos")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review section — only for renter on completed bookings */}
      {canReview && (
        <ReviewForm booking={booking} onSubmitted={onReviewSubmitted} />
      )}
      {hasReviewed && (
        <ReviewDisplay review={booking.review} />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab]               = useState("my");
  const [myBookings, setMyBookings] = useState([]);
  const [incoming,   setIncoming]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [myRes, inRes] = await Promise.all([
        authFetch("/api/bookings/my"),
        authFetch("/api/bookings/incoming"),
      ]);
      const myData = await myRes.json();
      const inData = await inRes.json();
      setMyBookings(myData.bookings || []);
      setIncoming(inData.bookings  || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (bookingId, action) => {
    try {
      await authFetch(`/api/bookings/${bookingId}/${action}`, { method:"PATCH" });
      load();
    } catch {
      alert(t("common.error"));
    }
  };

  const displayed    = tab === "my" ? myBookings : incoming;
  const pendingCount = incoming.filter(b => b.status === "pending").length;

  return (
    <div style={s.page}>
      <h1 style={s.title}>{t("bookings.title")}</h1>

      <div style={s.tabs}>
        <button onClick={() => setTab("my")}
          style={{ ...s.tab, ...(tab === "my" ? s.tabActive : {}) }}>
          {t("bookings.myRentals")} ({myBookings.length})
        </button>
        <button onClick={() => setTab("incoming")}
          style={{ ...s.tab, ...(tab === "incoming" ? s.tabActive : {}) }}>
          {t("bookings.incoming")} ({incoming.length})
          {pendingCount > 0 && <span style={s.badge}>{pendingCount}</span>}
        </button>
      </div>

      {loading && <div style={s.center}>{t("common.loading")}</div>}

      {!loading && displayed.length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize:"36px", marginBottom:"10px" }}>📋</div>
          <div style={{ fontWeight:500 }}>
            {tab === "my" ? t("bookings.noRentals") : t("bookings.noIncoming")}
          </div>
          <div style={{ fontSize:"13px", color:"#888", marginTop:"4px" }}>
            {tab === "my" ? t("bookings.noRentalsSub") : t("bookings.noIncomingSub")}
          </div>
        </div>
      )}

      {!loading && (
        <div style={s.list}>
          {displayed.map(b => (
            <BookingRow
              key={b._id}
              booking={b}
              incoming={tab === "incoming"}
              onAction={handleAction}
              onReviewSubmitted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page:        { padding:"2rem", maxWidth:"800px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  title:       { fontFamily:"'DM Serif Display', serif", fontSize:"26px", margin:"0 0 1.25rem" },
  tabs:        { display:"flex", gap:"4px", borderBottom:"0.5px solid #E8E6E0", marginBottom:"1.5rem" },
  tab:         { padding:"10px 16px", border:"none", background:"transparent", fontSize:"13px", fontWeight:500, cursor:"pointer", color:"#888", borderBottom:"2px solid transparent", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"6px" },
  tabActive:   { color:"#1a1a1a", borderBottomColor:"#1a1a1a" },
  badge:       { background:"#D85A30", color:"white", fontSize:"10px", padding:"2px 6px", borderRadius:"8px" },
  list:        { display:"flex", flexDirection:"column", gap:"10px" },
  rowWrap:     { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", overflow:"hidden" },
  row:         { padding:"14px", display:"flex", alignItems:"center", gap:"14px" },
  rowImg:      { width:"60px", height:"60px", borderRadius:"8px", background:"#EAF3DE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" },
  rowInfo:     { flex:1 },
  rowName:     { fontSize:"14px", fontWeight:500, marginBottom:"3px" },
  rowMeta:     { fontSize:"12px", color:"#888", marginBottom:"3px" },
  rowDates:    { fontSize:"11px", color:"#AAA" },
  rowRight:    { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px", flexShrink:0 },
  rowAmt:      { fontSize:"15px", fontWeight:500, color:"#3B6D11" },
  statusBadge: { fontSize:"10px", padding:"3px 9px", borderRadius:"8px", fontWeight:500 },
  rowActions:  { display:"flex", gap:"6px", flexWrap:"wrap", justifyContent:"flex-end" },
  btnConfirm:  { padding:"5px 10px", borderRadius:"6px", border:"none", background:"#3B6D11", color:"white", fontSize:"10px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  btnCancel:   { padding:"5px 10px", borderRadius:"6px", border:"0.5px solid #F09595", background:"#FCEBEB", color:"#791F1F", fontSize:"10px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  btnDispatch: { padding:"5px 10px", borderRadius:"6px", border:"none", background:"#0F6E56", color:"white", fontSize:"10px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  btnPay:      { padding:"5px 10px", borderRadius:"6px", border:"none", background:"#3B6D11", color:"white", fontSize:"10px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", textDecoration:"none" },
  center:      { textAlign:"center", padding:"3rem", color:"#888" },
  empty:       { textAlign:"center", padding:"4rem 2rem", color:"#888" },
};

const rs = {
  box:         { borderTop:"0.5px solid #E8E6E0", padding:"14px 14px 14px 88px", background:"#FAFAF8" },
  title:       { fontSize:"13px", fontWeight:500, marginBottom:"3px", color:"#1a1a1a" },
  sub:         { fontSize:"11px", color:"#888", marginBottom:"10px" },
  ratingLabel: { fontSize:"11px", color:"#F5A623", fontWeight:500, marginTop:"4px" },
  textarea:    { width:"100%", padding:"8px 10px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"12px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"none", marginBottom:"8px", marginTop:"8px" },
  err:         { fontSize:"11px", color:"#A32D2D", marginBottom:"6px" },
  btn:         { padding:"7px 18px", borderRadius:"8px", border:"none", background:"#3B6D11", color:"white", fontSize:"12px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  doneBox:     { borderTop:"0.5px solid #E8E6E0", padding:"12px 14px 12px 88px", background:"#F7FDF2" },
  doneTitle:   { fontSize:"12px", fontWeight:500, color:"#27500A", marginBottom:"6px" },
  doneComment: { fontSize:"12px", color:"#555", fontStyle:"italic", marginTop:"6px" },
};