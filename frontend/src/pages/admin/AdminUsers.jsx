import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

const ROLE_STYLE = {
  farmer: { background: "#EAF3DE", color: "#27500A" },
  vendor: { background: "#E1F5EE", color: "#085041" },
  admin:  { background: "#EEEDFE", color: "#3C3489" },
};

export default function AdminUsers() {
  const { authFetch }   = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [role, setRole]         = useState("");
  const [toast, setToast]       = useState("");
  const [suspending, setSuspending] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (role)   params.append("role",   role);
      const res  = await authFetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSuspend = async (id, name) => {
    if (!window.confirm(`Suspend ${name}? They will not be able to log in.`)) return;
    setSuspending(id);
    try {
      const res  = await authFetch(`/api/admin/users/${id}/suspend`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      load();
    } catch (err) {
      showToast(err.message || "Failed to suspend.");
    } finally {
      setSuspending(null);
    }
  };

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={s.header}>
        <div style={s.title}>User Management</div>
        <div style={s.filters}>
          <input style={s.searchInput} placeholder="Search name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()} />
          <select style={s.select} value={role} onChange={(e) => { setRole(e.target.value); }}>
            <option value="">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Admins</option>
          </select>
          <button onClick={load} style={s.searchBtn}>Search</button>
        </div>
      </div>

      {loading && <div style={s.center}>Loading users…</div>}

      {!loading && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Name", "Email", "Phone", "Role", "Status", "Joined", "Action"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={s.avatar}>{u.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name}</div>
                        {u.shopName && <div style={{ fontSize: "11px", color: "#888" }}>{u.shopName}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.phone}</td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, ...ROLE_STYLE[u.role] }}>{u.role}</span>
                    {u.role === "vendor" && u.vendorStatus && (
                      <span style={{ ...s.pill, marginLeft: "4px", background: u.vendorStatus === "approved" ? "#EAF3DE" : "#FAEEDA", color: u.vendorStatus === "approved" ? "#27500A" : "#633806" }}>
                        {u.vendorStatus}
                      </span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, ...(u.isActive ? { background: "#EAF3DE", color: "#27500A" } : { background: "#FCEBEB", color: "#791F1F" }) }}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={s.td}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={s.td}>
                    {u.isActive && u.role !== "admin" && (
                      <button
                        onClick={() => handleSuspend(u._id, u.name)}
                        disabled={suspending === u._id}
                        style={s.suspendBtn}
                      >
                        {suspending === u._id ? "…" : "Suspend"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: "center", color: "#888" }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  header:      { marginBottom: "1.25rem" },
  title:       { fontSize: "15px", fontWeight: 500, marginBottom: "12px" },
  filters:     { display: "flex", gap: "10px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", outline: "none" },
  select:      { padding: "8px 12px", borderRadius: "8px", border: "0.5px solid #DDD", fontSize: "13px", fontFamily: "inherit", background: "white", outline: "none" },
  searchBtn:   { padding: "8px 16px", borderRadius: "8px", border: "none", background: "#534AB7", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  tableWrap:   { background: "white", borderRadius: "12px", border: "0.5px solid #E8E6E0", overflow: "auto" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "700px" },
  th:          { padding: "10px 14px", fontSize: "11px", fontWeight: 500, color: "#888", textAlign: "left", background: "#F7F6F3", borderBottom: "0.5px solid #E8E6E0", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" },
  tr:          { borderBottom: "0.5px solid #F0EEE9" },
  td:          { padding: "11px 14px", fontSize: "12px", color: "#444", verticalAlign: "middle" },
  userCell:    { display: "flex", alignItems: "center", gap: "10px" },
  avatar:      { width: "28px", height: "28px", borderRadius: "50%", background: "#EEEDFE", color: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, flexShrink: 0 },
  pill:        { fontSize: "10px", padding: "3px 8px", borderRadius: "8px", fontWeight: 500, textTransform: "capitalize" },
  suspendBtn:  { padding: "5px 10px", borderRadius: "6px", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#791F1F", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" },
  center:      { textAlign: "center", padding: "3rem", color: "#888" },
  toast:       { position: "fixed", bottom: "24px", right: "24px", background: "#1C3A0E", color: "white", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", zIndex: 999 },
};
