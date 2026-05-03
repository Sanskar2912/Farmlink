import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useRazorpay } from "../components/useRazorpay";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const { authFetch } = useAuth();
  const { payForBooking } = useRazorpay();
  const navigate = useNavigate();

  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying,  setPaying]    = useState(false);
  const [error,   setError]     = useState("");
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch(`/api/bookings/${bookingId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setBooking(data.booking);
      } catch (err) {
        setError(err.message || "Booking not found.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const handlePay = () => {
    setPaying(true);
    setError("");
    payForBooking({
      bookingId,
      onSuccess: (updatedBooking) => {
        setPaying(false);
        setSuccess(true);
        setBooking(updatedBooking);
      },
      onFailure: (msg) => {
        setPaying(false);
        if (msg !== "Payment cancelled.") setError(msg);
      },
    });
  };

  if (loading) return <div style={s.center}>Loading…</div>;
  if (error && !booking) return <div style={s.center} style={{ color: "#A32D2D" }}>{error}</div>;

  const eq = booking?.equipment;

  return (
    <div style={s.page}>
      <button onClick={() => navigate("/bookings")} style={s.back}>← Back to bookings</button>

      <div style={s.card}>
        {success ? (
          <div style={s.successWrap}>
            <div style={s.successIcon}>✅</div>
            <h2 style={s.successTitle}>Payment Successful!</h2>
            <p style={s.successSub}>Your booking is confirmed. The owner has been notified.</p>
            <div style={s.receipt}>
              <div style={s.receiptRow}><span>Equipment</span><strong>{eq?.name}</strong></div>
              <div style={s.receiptRow}><span>Location</span><span>{eq?.city}</span></div>
              <div style={s.receiptRow}><span>Duration</span><span>{booking.totalDays} day{booking.totalDays > 1 ? "s" : ""}</span></div>
              <div style={s.receiptRow}><span>From</span><span>{new Date(booking.fromDate).toLocaleDateString("en-IN")}</span></div>
              <div style={s.receiptRow}><span>To</span><span>{new Date(booking.toDate).toLocaleDateString("en-IN")}</span></div>
              <div style={{ ...s.receiptRow, ...s.receiptTotal }}><span>Amount Paid</span><strong>₹{booking.totalAmount?.toLocaleString()}</strong></div>
            </div>
            <button onClick={() => navigate("/bookings")} style={s.primaryBtn}>View My Bookings</button>
          </div>
        ) : (
          <>
            <h1 style={s.title}>Complete Payment</h1>
            <p style={s.sub}>Review your booking and pay securely via Razorpay</p>

            {/* Booking summary */}
            <div style={s.summary}>
              <div style={s.summaryHead}>Booking Summary</div>
              <div style={s.summaryBody}>
                <div style={s.summaryRow}><span style={s.summaryLabel}>Equipment</span><span style={s.summaryVal}>{eq?.name || "—"}</span></div>
                <div style={s.summaryRow}><span style={s.summaryLabel}>Location</span><span style={s.summaryVal}>{eq?.city || "—"}</span></div>
                <div style={s.summaryRow}><span style={s.summaryLabel}>From</span><span style={s.summaryVal}>{new Date(booking.fromDate).toLocaleDateString("en-IN")}</span></div>
                <div style={s.summaryRow}><span style={s.summaryLabel}>To</span><span style={s.summaryVal}>{new Date(booking.toDate).toLocaleDateString("en-IN")}</span></div>
                <div style={s.summaryRow}><span style={s.summaryLabel}>Duration</span><span style={s.summaryVal}>{booking.totalDays} day{booking.totalDays > 1 ? "s" : ""}</span></div>
                <div style={s.summaryRow}><span style={s.summaryLabel}>Rate</span><span style={s.summaryVal}>₹{eq?.pricePerDay?.toLocaleString()}/day</span></div>
                <div style={{ ...s.summaryRow, ...s.totalRow }}>
                  <span>Total Amount</span>
                  <span style={s.totalAmt}>₹{booking.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status check */}
            {booking.paymentStatus === "paid" && (
              <div style={s.alreadyPaid}>✅ This booking has already been paid.</div>
            )}
            {booking.status === "pending" && (
              <div style={s.warnBox}>⚠️ The owner has not confirmed this booking yet. You can still pay — it will auto-confirm.</div>
            )}
            {booking.status === "cancelled" && (
              <div style={s.errBox}>❌ This booking was cancelled and cannot be paid.</div>
            )}

            {error && <div style={s.errBox}>{error}</div>}

            {/* Pay button */}
            {booking.paymentStatus !== "paid" && booking.status !== "cancelled" && (
              <button onClick={handlePay} disabled={paying} style={{ ...s.primaryBtn, opacity: paying ? 0.7 : 1 }}>
                {paying ? "Opening payment…" : `Pay ₹${booking.totalAmount?.toLocaleString()} via Razorpay`}
              </button>
            )}

            <div style={s.secureNote}>
              🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:        { padding: "2rem", maxWidth: "520px", margin: "0 auto", fontFamily: "'DM Sans', sans-serif" },
  back:        { fontSize: "13px", color: "#3B6D11", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "1.25rem", display: "block" },
  card:        { background: "white", borderRadius: "16px", border: "0.5px solid #E8E6E0", padding: "2rem" },
  title:       { fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "0 0 6px" },
  sub:         { fontSize: "13px", color: "#888", margin: "0 0 1.5rem" },
  summary:     { borderRadius: "10px", border: "0.5px solid #E8E6E0", overflow: "hidden", marginBottom: "1.25rem" },
  summaryHead: { background: "#F7F6F3", padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: "#555" },
  summaryBody: { padding: "4px 14px" },
  summaryRow:  { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid #F0EEE9", fontSize: "13px" },
  summaryLabel:{ color: "#888" },
  summaryVal:  { fontWeight: 500 },
  totalRow:    { fontWeight: 500, borderBottom: "none", borderTop: "0.5px solid #E8E6E0", marginTop: "4px", paddingTop: "12px" },
  totalAmt:    { fontSize: "18px", fontWeight: 500, color: "#3B6D11" },
  primaryBtn:  { width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "#3B6D11", color: "white", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: "4px" },
  secureNote:  { textAlign: "center", fontSize: "11px", color: "#AAA", marginTop: "12px" },
  errBox:      { background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#791F1F", marginBottom: "12px" },
  warnBox:     { background: "#FAEEDA", border: "0.5px solid #FAC775", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#633806", marginBottom: "12px" },
  alreadyPaid: { background: "#EAF3DE", border: "0.5px solid #97C459", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#27500A", marginBottom: "12px" },
  center:      { textAlign: "center", padding: "4rem", fontFamily: "'DM Sans', sans-serif", color: "#888" },
  successWrap: { textAlign: "center" },
  successIcon: { fontSize: "48px", marginBottom: "12px" },
  successTitle:{ fontFamily: "'DM Serif Display', serif", fontSize: "24px", margin: "0 0 8px" },
  successSub:  { fontSize: "13px", color: "#888", marginBottom: "1.5rem" },
  receipt:     { background: "#F7F6F3", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" },
  receiptRow:  { display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "0.5px solid #EEECE6" },
  receiptTotal:{ borderBottom: "none", borderTop: "0.5px solid #DDD", paddingTop: "10px", marginTop: "4px", fontWeight: 500 },
};
