import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useState, useEffect } from "react";

const FARMER_NAV = [
  { path: "/about", labelKey: "nav.about" },
  { path: "/farmer-dashboard", labelKey: "nav.dashboard" },
  { path: "/equipment", labelKey: "nav.equipment" },
  { path: "/bookings", labelKey: "nav.bookings" },
  { path: "/ai-advisor", labelKey: "nav.aiAdvisor" },
  { path: "/weather", labelKey: "nav.weather" },
];

const VENDOR_NAV = [
  { path: "/about", labelKey: "nav.about" },
  { path: "/vendor-dashboard", labelKey: "nav.dashboard" },
  { path: "/equipment", labelKey: "nav.equipment" },
  { path: "/bookings", labelKey: "nav.bookings" },
  { path: "/weather", labelKey: "nav.weather" },
];

const ADMIN_NAV = [{ path: "/admin", labelKey: "nav.adminPanel" }];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (!user) return null;

  const navItems =
    user.role === "admin"
      ? ADMIN_NAV
      : user.role === "vendor"
      ? VENDOR_NAV
      : FARMER_NAV;

  const ROLE_STYLE = {
    farmer: { background: "#EAF3DE", color: "#27500A" },
    vendor: { background: "#E1F5EE", color: "#085041" },
    admin: { background: "#EEEDFE", color: "#3C3489" },
  };

  return (
    <>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => navigate("/dashboard")}>
          <div style={s.logoLeaf}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8"/>
            </svg>
          </div>
          <span style={s.logoText}>FarmLink</span>
        </div>

        {/* Desktop Links */}
        {!isMobile && (
          <div style={s.links}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...s.link,
                  ...(location.pathname.startsWith(item.path)
                    ? s.linkActive
                    : {}),
                }}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        )}

        <div style={s.right}>
          <LanguageSwitcher compact />

          <span style={{ ...s.roleBadge, ...ROLE_STYLE[user.role] }}>
            {t(`nav.role_${user.role}`)}
          </span>

          <div
            style={s.avatar}
            onClick={() => navigate("/profile")}
            title={t("nav.profile")}
          >
            {user.name?.[0]?.toUpperCase()}
          </div>

          {/* ORIGINAL LOGOUT BUTTON */}
          {!isMobile && (
            <button onClick={logout} style={s.logoutBtn} title={t("nav.logout")}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M9 14l4-4-4-4M3 10h10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <button style={s.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
              ☰
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div style={s.mobileMenu}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMenuOpen(false);
              }}
              style={s.mobileLink}
            >
              {t(item.labelKey)}
            </button>
          ))}

          {/* same logout icon in mobile */}
          <button onClick={logout} style={s.mobileLink}>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </>
  );
}

const s = {
  nav:{display:"flex",alignItems:"center",height:"56px",padding:"0 1.5rem",background:"white",borderBottom:"0.5px solid #E8E6E0",gap:"16px",fontFamily:"'DM Sans', sans-serif",position:"sticky",top:0,zIndex:100},
  logo:{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",flexShrink:0},
  logoLeaf:{width:"30px",height:"30px",background:"#3B6D11",borderRadius:"50% 6px 50% 6px",display:"flex",alignItems:"center",justifyContent:"center"},
  logoText:{fontFamily:"'DM Serif Display', serif",fontSize:"20px",color:"#1C3A0E"},
  links:{display:"flex",gap:"2px",flex:1},
  link:{padding:"6px 12px",borderRadius:"6px",border:"none",background:"transparent",fontSize:"13px",fontWeight:500,cursor:"pointer",color:"#888"},
  linkActive:{background:"#EAF3DE",color:"#27500A"},
  right:{display:"flex",alignItems:"center",gap:"10px"},
  roleBadge:{fontSize:"10px",fontWeight:500,padding:"3px 8px",borderRadius:"8px"},
  avatar:{width:"30px",height:"30px",borderRadius:"50%",background:"#EAF3DE",color:"#27500A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:500,cursor:"pointer"},
  logoutBtn:{background:"none",border:"none",cursor:"pointer",color:"#AAA",display:"flex",alignItems:"center",padding:"4px"},
  menuBtn:{fontSize:"22px",border:"none",background:"none",cursor:"pointer"},
  mobileMenu:{display:"flex",flexDirection:"column",background:"white",borderBottom:"1px solid #eee"},
  mobileLink:{padding:"12px",border:"none",background:"white",textAlign:"left",cursor:"pointer"}
};