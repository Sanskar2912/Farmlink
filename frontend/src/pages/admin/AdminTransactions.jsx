import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

const STATUS_STYLE = {
  pending:   { background: "#FAEEDA", color: "#633806" },
  confirmed: { background: "#EAF3DE", color: "#27500A" },
  cancelled: { background: "#FCEBEB", color: "#791F1F" },
  completed: { background: "#E1F5EE", color: "#085041" },
};

const PAY_STYLE = {
  paid:     { background: "#EAF3DE", color: "#27500A" },
  unpaid:   { background: "#FAEEDA", color: "#633806" },
  refunded: { background: "#E6F1FB", color: "#0C447C" },
};

export default function AdminTransactions() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [totalRevenue, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Use admin stats endpoint then fetch all bookings via equipment
        const res  = await authFetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) {
          setBookings(data.recentBookings || []);
          // Calculate platform revenue (10% commission model)
          const revenue = (data.recentBookings || [])
            .filter((b) => b.paymentStatus === "paid")
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
          setTotal(revenue);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      <div style={s.header}>
        <div style={s.title}>Transactions</div>
        <div style={s.revCard}>
          <div style={s.revLabel}>Platform Revenue (10% commission)</div>
          <div style={s.revVal}>₹{Math.round(totalRevenue * 0.1).toLocaleString()}</div>
        </div>
      </div>

      {loading && <div style={s.center}>Loading transactions…</div>}

      {!loading && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Renter", "Equipment", "Owner", "From", "To", "Days", "Amount", "Booking", "Payment"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>{b.renter?.name || "—"}</td>
                  <td style={s.td}>{b.equipment?.name || "—"}</td>
                  <td style={s.td}>{b.owner?.name || b.owner?.shopName || "—"}</td>
                  <td style={s.td}>{new Date(b.fromDate).toLocaleDateString("en-IN")}</td>
                  <td style={s.td}>{new Date(b.toDate).toLocaleDateString("en-IN")}</td>
                  <td style={s.td}>{b.totalDays}</td>
                  <td style={{ ...s.td, fontWeight: 500 }}>₹{b.totalAmount?.toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, ...STATUS_STYLE[b.status] }}>{b.status}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, ...PAY_STYLE[b.paymentStatus || "unpaid"] }}>
                      {b.paymentStatus || "unpaid"}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: "#888" }}>No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={s.note}>
        Showing most recent 5 bookings. Full transaction export coming in the next update.
      </div>
    </div>
  );
}

const s = {
  header:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "12px" },
  title:    { fontSize: "15px", fontWeight: 500 },
  revCard:  { background: "white", borderRadius: "10px", border: "0.5px solid #E8E6E0", padding: "12px 16px", textAlign: "right" },
  revLabel: { fontSize: "11px", color: "#888", marginBottom: "4px" },
  revVal:   { fontSize: "20px", fontWeight: 500, color: "#3B6D11" },
  tableWrap:{ background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", overflow: "auto" },
  table:    { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  th:       { padding: "10px 12px", fontSize: "11px", fontWeight: 500, color: "#888", textAlign: "left", background: "#F7F6F3", borderBottom: "0.5px solid #E8E6E0", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" },
  tr:       { borderBottom: "0.5px solid #F0EEE9" },
  td:       { padding: "10px 12px", fontSize: "12px", color: "#444" },
  pill:     { fontSize: "10px", padding: "3px 8px", borderRadius: "8px", fontWeight: 500, textTransform: "capitalize" },
  center:   { textAlign: "center", padding: "3rem", color: "#888" },
  note:     { fontSize: "11px", color: "#AAA", marginTop: "12px", textAlign: "center" },
};
