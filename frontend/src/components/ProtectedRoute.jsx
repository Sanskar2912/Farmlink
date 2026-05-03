import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Usage:
// <ProtectedRoute>              → any logged-in user
// <ProtectedRoute role="admin"> → admin only
// <ProtectedRoute role={["farmer","vendor"]}> → farmer or vendor

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#888", fontSize: "14px" }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Vendor pending approval — redirect to waiting page (but not if already there)
  if (user.role === "vendor" && user.vendorStatus === "pending" && location.pathname !== "/pending-approval") {
    return <Navigate to="/pending-approval" replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    // Allow pending vendors through to /pending-approval regardless of role check
    if (!allowed.includes(user.role) && location.pathname !== "/pending-approval") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}