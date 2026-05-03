import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",    flag: "🇮🇳" },
  { code: "mr", label: "मराठी",    flag: "🇮🇳" },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("fl_language", code);
  };

  if (compact) {
    // Dropdown version for navbar
    return (
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        style={s.select}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    );
  }

  // Button group version for settings/profile page
  return (
    <div style={s.group}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          style={{
            ...s.btn,
            ...(i18n.language === l.code ? s.btnActive : {}),
          }}
        >
          <span style={{ fontSize: "16px" }}>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

const s = {
  select: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "0.5px solid #DDD",
    background: "white",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
    color: "#555",
  },
  group: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "0.5px solid #DDD",
    background: "white",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    color: "#555",
    transition: "all .15s",
  },
  btnActive: {
    background: "#EAF3DE",
    border: "0.5px solid #97C459",
    color: "#27500A",
    fontWeight: 500,
  },
};
