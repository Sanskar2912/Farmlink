import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import AuthPage            from "./pages/AuthPage";
import FarmerDashboard     from "./pages/FarmerDashboard";
import VendorDashboard     from "./pages/VendorDashboard";
import EquipmentPage       from "./pages/EquipmentPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import AddEquipmentPage    from "./pages/AddEquipmentPage";
import BookingsPage        from "./pages/BookingsPage";
import PaymentPage         from "./pages/PaymentPage";
import AIAdvisorPage       from "./pages/AIAdvisorPage";
import WeatherPage         from "./pages/WeatherPage";
import ProfilePage         from "./pages/ProfilePage";
import AdminPage           from "./pages/admin/AdminPage";
import ConditionPhotosPage from "./pages/ConditionPhotosPage";
import ForgotPasswordPage  from "./pages/ForgotPasswordPage";
import ResetPasswordPage   from "./pages/ResetPasswordPage";
import AboutPage           from "./pages/AboutPage";

function Footer() {
  return (
    <footer style={{ background:"#1C3A0E", color:"rgba(255,255,255,0.7)", fontFamily:"'DM Sans', sans-serif", padding:"2rem 1.5rem 1.25rem", marginTop:"3rem" }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1.5rem", marginBottom:"1.5rem" }}>

          {/* Brand */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
              <div style={{ width:"28px", height:"28px", background:"#3B6D11", borderRadius:"50% 6px 50% 6px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8"/></svg>
              </div>
              <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:"18px", color:"white" }}>FarmLink</span>
            </div>
            <p style={{ fontSize:"12px", lineHeight:1.6, maxWidth:"220px", margin:0 }}>
              Connecting farmers and vendors across India for smarter, more affordable equipment rental.
            </p>
          </div>

          {/* Links */}
          <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:"11px", fontWeight:600, color:"white", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"10px" }}>Platform</div>
              {["Browse Equipment","My Bookings","AI Crop Advisor","Weather Forecast"].map(l => (
                <div key={l} style={{ fontSize:"12px", marginBottom:"6px" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:600, color:"white", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"10px" }}>Support</div>
              {["Help Center","Contact Us","Report an Issue","Privacy Policy"].map(l => (
                <div key={l} style={{ fontSize:"12px", marginBottom:"6px" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"0.5px solid rgba(255,255,255,0.15)", paddingTop:"1rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
          <span style={{ fontSize:"11px" }}>© {new Date().getFullYear()} FarmLink. All rights reserved.</span>
          <span style={{ fontSize:"11px" }}>Made with 🌱 for Indian farmers</span>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <div style={{ minHeight:"100vh", background:"#F7F6F3", display:"flex", flexDirection:"column" }}>
      <Navbar />
      <div style={{ flex:1 }}>{children}</div>
      <Footer />
    </div>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === "admin")  return <Navigate to="/admin"            replace />;
  if (user.role === "vendor") return <Navigate to="/vendor-dashboard" replace />;
  return <Navigate to="/about
" replace />;
}

function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <Layout>
      <div style={centered}>
        <div style={{ fontSize:"36px", marginBottom:"12px" }}>⏳</div>
        <div style={{ fontWeight:500, fontSize:"16px", marginBottom:"8px" }}>Vendor approval pending</div>
        <div style={{ fontSize:"13px", color:"#888", maxWidth:"320px", textAlign:"center", marginBottom:"20px" }}>
          Hi {user?.name}, your vendor application is under review. An admin will approve your account shortly.
        </div>
        <button onClick={handleLogout} style={{ padding:"8px 20px", borderRadius:"8px", border:"0.5px solid #ddd", background:"white", cursor:"pointer", fontSize:"13px", fontFamily:"inherit" }}>
          Sign out &amp; log in as different user
        </button>
      </div>
    </Layout>
  );
}

function AuthRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage onAuth={() => navigate("/dashboard", { replace: true })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth"              element={<AuthRedirect />} />
          <Route path="/pending-approval"  element={<ProtectedRoute role="vendor"><PendingApproval /></ProtectedRoute>} />
          <Route path="/dashboard"         element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

          <Route path="/farmer-dashboard"  element={<ProtectedRoute role="farmer"><Layout><FarmerDashboard /></Layout></ProtectedRoute>} />
          <Route path="/vendor-dashboard"  element={<ProtectedRoute role="vendor"><Layout><VendorDashboard /></Layout></ProtectedRoute>} />

          <Route path="/equipment"         element={<ProtectedRoute><Layout><EquipmentPage /></Layout></ProtectedRoute>} />
          <Route path="/equipment/new"     element={<ProtectedRoute><Layout><AddEquipmentPage /></Layout></ProtectedRoute>} />
          <Route path="/equipment/:id"     element={<ProtectedRoute><Layout><EquipmentDetailPage /></Layout></ProtectedRoute>} />

          <Route path="/bookings"          element={<ProtectedRoute><Layout><BookingsPage /></Layout></ProtectedRoute>} />
          <Route path="/pay/:bookingId"    element={<ProtectedRoute><Layout><PaymentPage /></Layout></ProtectedRoute>} />

          <Route path="/condition/:bookingId" element={<ProtectedRoute><Layout><ConditionPhotosPage /></Layout></ProtectedRoute>} />

          <Route path="/ai-advisor"        element={<ProtectedRoute><Layout><AIAdvisorPage /></Layout></ProtectedRoute>} />
          <Route path="/weather"           element={<ProtectedRoute><Layout><WeatherPage /></Layout></ProtectedRoute>} />
          <Route path="/profile"           element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/admin"             element={<ProtectedRoute role="admin"><Layout><AdminPage /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />

          <Route path="/about" element={<ProtectedRoute><Layout><AboutPage /></Layout></ProtectedRoute>} />

          <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const centered = { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"calc(100vh - 56px)", fontFamily:"'DM Sans', sans-serif" };