import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useTranslation } from "react-i18next";

const SOILS   = ["Jalod Mitti (Alluvial) -Nadiyon ke paas milne wali upjaau mitti.","Kaali Mitti (Black Cotton)–Kapas ugane ke liye best mitti.",
  "Laal Domat Mitti (Red Loamy) – Laal rang ki mitti jo iron se rich hoti hai.","Retili Domat Mitti (Sandy Loam) – Ret aur mitti ka mix.","Laterite Mitti – Zyada baarish wale areas mein milti hai.","Chikni Mitti (Clay) – Bahut chipakne wali mitti."];
const SEASONS = ["Kharif (Jun–Oct)","Rabi (Oct–Mar)","Zaid (Mar–Jun)"];
const CROPS   = ["Wheat","Rice","Maize","Sugarcane","Cotton","Soybean","Mustard","Potato","Tomato","Onion"];

const CROP_ICONS     = { Wheat:"🌾", Rice:"🍚", Maize:"🌽", Sugarcane:"🎋", Cotton:"☁️", Soybean:"🫘", Mustard:"🌼", Potato:"🥔", Tomato:"🍅", Onion:"🧅" };
const DEMAND_COLOR   = { High:{ bg:"#EAF3DE", color:"#27500A", dot:"#3B6D11" }, Medium:{ bg:"#FAEEDA", color:"#633806", dot:"#D97706" }, Low:{ bg:"#FCEBEB", color:"#791F1F", dot:"#DC2626" } };
const SEVERITY_COLOR = { Low:{ bg:"#EAF3DE", color:"#27500A" }, Medium:{ bg:"#FAEEDA", color:"#633806" }, High:{ bg:"#FCEBEB", color:"#791F1F" } };

function Spinner({ text }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"3rem", gap:"16px" }}>
      <div style={{ position:"relative", width:"48px", height:"48px" }}>
        <div style={{ position:"absolute", inset:0, border:"3px solid #EAF3DE", borderRadius:"50%" }} />
        <div style={{ position:"absolute", inset:0, border:"3px solid transparent", borderTopColor:"#3B6D11", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      </div>
      <div style={{ fontSize:"13px", color:"#888", fontWeight:500 }}>{text}</div>
    </div>
  );
}

export default function AIAdvisorPage() {
  const { authFetch } = useAuth();
  const { t, i18n }  = useTranslation();
  const [activeTab, setActiveTab] = useState("crop");

  const [cropForm, setCropForm]       = useState({ soilType:"Jalod Mitti (Alluvial) -Nadiyon ke paas milne wali upjaau mitti.", season:"Rabi (Oct–Mar)", location:"", currentCrop:"" });
  const [cropAdvice, setCropAdvice]   = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError]     = useState("");

  const [image, setImage]             = useState(null);
  const [imagePreview, setPreview]    = useState(null);
  const [cropName, setCropName]       = useState("");
  const [analysis, setAnalysis]       = useState(null);
  const [imgLoading, setImgLoading]   = useState(false);
  const [imgError, setImgError]       = useState("");

  const [selectedCrops, setSelectedCrops] = useState(["Wheat","Rice"]);
  const [marketData, setMarketData]       = useState(null);
  const [mktLoading, setMktLoading]       = useState(false);
  const [mktError, setMktError]           = useState("");

  const lang = i18n.language || "en";

  const getCropAdvice = async () => {
    setCropLoading(true); setCropError(""); setCropAdvice(null);
    try {
      const res  = await authFetch("/api/ai/crop-advice", { method:"POST", body: JSON.stringify({ ...cropForm, language: lang }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCropAdvice(data.advice);
    } catch (err) { setCropError(err.message || t("common.error")); }
    finally { setCropLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file); setPreview(URL.createObjectURL(file)); setAnalysis(null);
  };

  const detectDisease = async () => {
    if (!image) return;
    setImgLoading(true); setImgError(""); setAnalysis(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(image);
      });
      const response = await authFetch("/api/ai/disease-detect", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mimeType: image.type, cropName, language: lang }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setAnalysis(data.analysis);
    } catch (err) { setImgError(err.message || t("common.error")); }
    finally { setImgLoading(false); }
  };

  const getMarketDemand = async () => {
    setMktLoading(true); setMktError(""); setMarketData(null);
    try {
      const res  = await authFetch("/api/ai/market-demand", { method:"POST", body: JSON.stringify({ crops: selectedCrops, location: cropForm.location || "Uttar Pradesh", language: lang }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMarketData(data.market);
    } catch (err) { setMktError(err.message || t("common.error")); }
    finally { setMktLoading(false); }
  };

  const toggleCrop = (c) => setSelectedCrops(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const TABS = [
    { id:"crop",    icon:"🌾", label:t("ai.cropAdvice"),    desc:t("ai.farmDetails") },
    { id:"disease", icon:"🔬", label:t("ai.diseaseDetect"), desc:t("ai.uploadPhoto") },
    { id:"market",  icon:"📊", label:t("ai.marketDemand"),  desc:t("ai.selectCrops") },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif" }}>

      {/* ── Responsive Styles ─────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ai-tab-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 2rem;
          margin-top: -1.5rem;
        }

        .ai-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .ai-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .ai-eq-harvest-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ai-market-3col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ai-diag-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ai-hero {
          position: relative;
          background: linear-gradient(135deg, #0a1a06 0%, #1C3A0E 50%, #2d5a1a 100%);
          padding: 3rem 2rem 3.5rem;
          overflow: hidden;
        }

        .ai-page {
          padding: 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .ai-season-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-top: 6px;
        }

        @media (max-width: 768px) {
          .ai-hero {
            padding: 2rem 1rem 2.5rem;
          }

          .ai-page {
            padding: 1rem;
          }

          .ai-tab-cards {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: -1rem;
            overflow-x: auto;
            display: flex;
            flex-direction: row;
            padding-bottom: 4px;
          }

          .ai-tab-card {
            min-width: 130px;
            flex-shrink: 0;
          }

          .ai-grid2 {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .ai-row2 {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .ai-eq-harvest-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .ai-market-3col {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 6px;
          }

          .ai-diag-2col {
            grid-template-columns: 1fr 1fr;
          }

          .ai-season-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 480px) {
          .ai-hero-title {
            font-size: 26px !important;
          }

          .ai-market-3col {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .ai-diag-2col {
            grid-template-columns: 1fr;
          }

          .ai-season-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="ai-hero">
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>✨ {t("ai.subtitle")}</div>
          <h1 className="ai-hero-title" style={s.heroTitle}>{t("ai.title")}</h1>
          <p style={s.heroSub}>Smart farming intelligence — crop advice, disease detection, and market insights.</p>
        </div>
      </div>

      <div className="ai-page">

        {/* ── Tab Cards ─────────────────────────────────────────────── */}
        <div className="ai-tab-cards">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="ai-tab-card"
              style={{ ...s.tabCard, ...(activeTab === tab.id ? s.tabCardActive : {}) }}>
              <div style={s.tabCardIcon}>{tab.icon}</div>
              <div style={s.tabCardLabel}>{tab.label}</div>
              <div style={s.tabCardDesc}>{tab.desc}</div>
              {activeTab === tab.id && <div style={s.activeDot} />}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Crop Advice ───────────────────────────────────── */}
        {activeTab === "crop" && (
          <div className="ai-grid2">
            <div>
              <div style={s.panelHeader}>
                <div style={s.panelIconBox}>🌱</div>
                <div>
                  <div style={s.panelTitle}>{t("ai.farmDetails")}</div>
                  <div style={s.panelSub}>{t("ai.placeholder")}</div>
                </div>
              </div>
              <div style={s.inputCard}>
                <div style={s.field}>
                  <label style={s.label}>{t("ai.soilType")}</label>
                  <select style={s.input} value={cropForm.soilType} onChange={e => setCropForm(f=>({...f,soilType:e.target.value}))}>
                    {SOILS.map(soil => <option key={soil}>{soil}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>{t("ai.season")}</label>
                  <div className="ai-season-grid">
                    {SEASONS.map(season => (
                      <button key={season} type="button" onClick={() => setCropForm(f=>({...f,season}))}
                        style={{ ...s.seasonBtn, ...(cropForm.season === season ? s.seasonBtnActive : {}) }}>
                        {season.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ai-row2">
                  <div style={s.field}>
                    <label style={s.label}>{t("ai.location")}</label>
                    <input style={s.input} placeholder={t("ai.locationPlaceholder")} value={cropForm.location}
                      onChange={e => setCropForm(f=>({...f,location:e.target.value}))} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>{t("ai.lastCrop")}</label>
                    <input style={s.input} placeholder="e.g. Rice" value={cropForm.currentCrop}
                      onChange={e => setCropForm(f=>({...f,currentCrop:e.target.value}))} />
                  </div>
                </div>
                {cropError && <div style={s.errBox}>{cropError}</div>}
                <button onClick={getCropAdvice} disabled={cropLoading} style={{ ...s.aiBtn, opacity:cropLoading?0.7:1 }}>
                  {cropLoading ? t("ai.analyzing") : t("ai.getAdvice")}
                </button>
              </div>
            </div>

            <div>
              {cropLoading && <Spinner text={t("ai.analyzing")} />}
              {!cropLoading && !cropAdvice && (
                <div style={s.emptyState}>
                  <div style={{ fontSize:"52px", marginBottom:"14px" }}>🌾</div>
                  <div style={s.emptyTitle}>{t("ai.farmDetails")}</div>
                  <div style={s.emptySub}>{t("ai.placeholder")}</div>
                </div>
              )}
              {cropAdvice && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {/* Recommended Crops */}
                  <div style={s.resultCard}>
                    <div style={s.resultHeader}><span style={s.rIcon}>🌾</span><span style={s.rTitle}>{t("ai.recommendedCrops")}</span></div>
                    {cropAdvice.recommendedCrops?.map((c, i) => (
                      <div key={i} style={{ ...s.cropItem, borderLeft:`3px solid ${["#3B6D11","#0F6E56","#185FA5"][i%3]}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"4px", flexWrap:"wrap", gap:"4px" }}>
                          <div style={s.cropName}>{c.name}</div>
                          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                            <span style={s.metaPill}>📦 {c.expectedYield}</span>
                            <span style={{ ...s.metaPill, background:"#EAF3DE", color:"#27500A" }}>💰 {c.marketPrice}</span>
                          </div>
                        </div>
                        <div style={s.cropReason}>{c.reason}</div>
                      </div>
                    ))}
                  </div>
                  {/* Fertilizers */}
                  <div style={s.resultCard}>
                    <div style={s.resultHeader}><span style={s.rIcon}>🧪</span><span style={s.rTitle}>{t("ai.fertilizers")}</span></div>
                    {cropAdvice.fertilizers?.map((f, i) => (
                      <div key={i} style={{ padding:"8px 0", borderBottom:"0.5px solid #F0EEE9" }}>
                        <div style={{ fontSize:"13px", fontWeight:500, color:"#1a1a1a", marginBottom:"3px" }}>{f.name}</div>
                        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                          <span style={s.fertTag}>⚖️ {f.quantity}</span>
                          <span style={s.fertTag}>🗓️ {f.timing}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Equipment + Harvest */}
                  <div className="ai-eq-harvest-grid">
                    <div style={s.resultCard}>
                      <div style={s.resultHeader}><span style={s.rIcon}>🚜</span><span style={s.rTitle}>{t("ai.recommendedEquipment")}</span></div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                        {cropAdvice.equipment?.map((e, i) => <span key={i} style={s.eqChip}>{e}</span>)}
                      </div>
                    </div>
                    {cropAdvice.harvestTime && (
                      <div style={{ ...s.resultCard, background:"linear-gradient(135deg,#1C3A0E,#3B6D11)", color:"white" }}>
                        <div style={{ fontSize:"10px", opacity:0.7, marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{t("ai.harvestTime")}</div>
                        <div style={{ fontSize:"24px", marginBottom:"6px" }}>🗓️</div>
                        <div style={{ fontSize:"13px", fontWeight:500 }}>{cropAdvice.harvestTime}</div>
                      </div>
                    )}
                  </div>
                  {/* Warnings */}
                  {cropAdvice.warnings?.length > 0 && (
                    <div style={{ background:"#FFFBEB", border:"1px solid #FCD34D", borderRadius:"12px", padding:"1rem" }}>
                      <div style={{ fontSize:"13px", fontWeight:600, color:"#92400E", marginBottom:"8px" }}>{t("ai.warnings")}</div>
                      {cropAdvice.warnings.map((w, i) => <div key={i} style={{ fontSize:"12px", color:"#92400E", padding:"3px 0" }}>• {w}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Disease Detection ────────────────────────────────── */}
        {activeTab === "disease" && (
          <div className="ai-grid2">
            <div>
              <div style={s.panelHeader}>
                <div style={s.panelIconBox}>🔬</div>
                <div>
                  <div style={s.panelTitle}>{t("ai.uploadPhoto")}</div>
                  <div style={s.panelSub}>{t("ai.imagePlaceholder")}</div>
                </div>
              </div>
              <div style={s.inputCard}>
                <div style={s.field}>
                  <label style={s.label}>{t("ai.cropName")}</label>
                  <input style={s.input} placeholder={t("ai.cropNamePlaceholder")} value={cropName}
                    onChange={e => setCropName(e.target.value)} />
                </div>
                <label style={{ display:"block", borderRadius:"12px", overflow:"hidden", marginBottom:"14px", cursor:"pointer" }}>
                  {imagePreview ? (
                    <div style={{ position:"relative", height:"180px" }}>
                      <img src={imagePreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"13px", fontWeight:500 }}>
                        📷 {t("ai.clickUpload")}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #DDD", borderRadius:"12px", padding:"2.5rem 1rem", background:"#FAFAF8", minHeight:"160px" }}>
                      <div style={{ fontSize:"48px", marginBottom:"10px" }}>📷</div>
                      <div style={{ fontWeight:500, fontSize:"14px", marginBottom:"4px", color:"#333" }}>{t("ai.clickUpload")}</div>
                      <div style={{ fontSize:"11px", color:"#AAA" }}>JPG, PNG · up to 10MB</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display:"none" }} />
                </label>
                {imgError && <div style={s.errBox}>{imgError}</div>}
                <button onClick={detectDisease} disabled={!image || imgLoading}
                  style={{ ...s.aiBtn, background:!image?"#AAA":"linear-gradient(135deg,#3B6D11,#2d5a1a)", opacity:imgLoading?0.7:1, cursor:!image?"not-allowed":"pointer" }}>
                  {imgLoading ? t("ai.detecting") : t("ai.detectBtn")}
                </button>
              </div>
            </div>

            <div>
              {imgLoading && <Spinner text={t("ai.detecting")} />}
              {!imgLoading && !analysis && (
                <div style={s.emptyState}>
                  <div style={{ fontSize:"52px", marginBottom:"14px" }}>🔬</div>
                  <div style={s.emptyTitle}>{t("ai.uploadPhoto")}</div>
                  <div style={s.emptySub}>{t("ai.imagePlaceholder")}</div>
                </div>
              )}
              {analysis && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div style={{ ...s.resultCard, border: analysis.healthStatus === "Healthy" ? "1.5px solid #97C459" : "1.5px solid #F09595" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px", flexWrap:"wrap", gap:"8px" }}>
                      <div style={s.resultHeader}>
                        <span style={s.rIcon}>{analysis.healthStatus === "Healthy" ? "✅" : "🚨"}</span>
                        <span style={s.rTitle}>Diagnosis</span>
                      </div>
                      <span style={{ fontSize:"10px", padding:"3px 10px", borderRadius:"8px", fontWeight:500, ...(analysis.urgency?.includes("Immediate") ? { background:"#FCEBEB", color:"#791F1F" } : { background:"#EAF3DE", color:"#27500A" }) }}>
                        {analysis.urgency}
                      </span>
                    </div>
                    <div className="ai-diag-2col">
                      <div style={{ background:"#F7F6F3", borderRadius:"8px", padding:"10px" }}>
                        <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"3px" }}>Crop</div>
                        <div style={{ fontSize:"14px", fontWeight:600 }}>{analysis.cropIdentified || "Unknown"}</div>
                      </div>
                      <div style={{ background: analysis.healthStatus === "Healthy" ? "#EAF3DE" : "#FCEBEB", borderRadius:"8px", padding:"10px" }}>
                        <div style={{ fontSize:"9px", color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"3px" }}>Health</div>
                        <div style={{ fontSize:"14px", fontWeight:600, color: analysis.healthStatus === "Healthy" ? "#3B6D11" : "#A32D2D" }}>{analysis.healthStatus}</div>
                      </div>
                    </div>
                    {analysis.issues?.map((issue, i) => (
                      <div key={i} style={{ padding:"10px 0", borderBottom:"0.5px solid #F0EEE9" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px", flexWrap:"wrap", gap:"4px" }}>
                          <strong style={{ fontSize:"13px" }}>{issue.name}</strong>
                          <span style={{ fontSize:"10px", padding:"3px 9px", borderRadius:"8px", ...SEVERITY_COLOR[issue.severity] }}>{issue.severity}</span>
                        </div>
                        <div style={{ fontSize:"12px", color:"#555" }}>{issue.description}</div>
                      </div>
                    ))}
                  </div>
                  {analysis.treatments?.length > 0 && (
                    <div style={s.resultCard}>
                      <div style={s.resultHeader}><span style={s.rIcon}>💊</span><span style={s.rTitle}>Treatment Plan</span></div>
                      {analysis.treatments.map((tr, i) => (
                        <div key={i} style={{ padding:"10px 0", borderBottom:"0.5px solid #F0EEE9" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px", flexWrap:"wrap", gap:"4px" }}>
                            <strong style={{ fontSize:"13px" }}>{tr.name}</strong>
                            <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", background:"#E1F5EE", color:"#085041" }}>{tr.type}</span>
                          </div>
                          <div style={{ fontSize:"12px", color:"#555" }}>⚖️ {tr.dosage}</div>
                          <div style={{ fontSize:"12px", color:"#555", marginTop:"2px" }}>{tr.instructions}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {analysis.preventionTips?.length > 0 && (
                    <div style={{ ...s.resultCard, background:"#F0FDF4", border:"0.5px solid #97C459" }}>
                      <div style={s.resultHeader}><span style={s.rIcon}>🛡️</span><span style={s.rTitle}>Prevention Tips</span></div>
                      {analysis.preventionTips.map((tip, i) => (
                        <div key={i} style={{ fontSize:"12px", color:"#27500A", padding:"4px 0", borderBottom:"0.5px solid #D1FAE5" }}>✓ {tip}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: Market Demand ─────────────────────────────────── */}
        {activeTab === "market" && (
          <div className="ai-grid2">
            <div>
              <div style={s.panelHeader}>
                <div style={s.panelIconBox}>📊</div>
                <div>
                  <div style={s.panelTitle}>{t("ai.marketDemand")}</div>
                  <div style={s.panelSub}>{t("ai.marketPlaceholder")}</div>
                </div>
              </div>
              <div style={s.inputCard}>
                <div style={s.field}>
                  <label style={s.label}>{t("ai.selectCrops")}</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginTop:"6px" }}>
                    {CROPS.map(c => (
                      <button key={c} onClick={() => toggleCrop(c)}
                        style={{ ...s.cropToggle, ...(selectedCrops.includes(c) ? s.cropToggleActive : {}) }}>
                        {CROP_ICONS[c]} {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>{t("ai.location")}</label>
                  <input style={s.input} placeholder={t("ai.locationPlaceholder")} value={cropForm.location}
                    onChange={e => setCropForm(f=>({...f,location:e.target.value}))} />
                </div>
                {mktError && <div style={s.errBox}>{mktError}</div>}
                <button onClick={getMarketDemand} disabled={mktLoading || selectedCrops.length === 0}
                  style={{ ...s.aiBtn, opacity:(mktLoading||selectedCrops.length===0)?0.6:1 }}>
                  {mktLoading ? t("ai.fetchingMarket") : t("ai.getMarket")}
                </button>
              </div>
            </div>

            <div>
              {mktLoading && <Spinner text={t("ai.fetchingMarket")} />}
              {!mktLoading && !marketData && (
                <div style={s.emptyState}>
                  <div style={{ fontSize:"52px", marginBottom:"14px" }}>📊</div>
                  <div style={s.emptyTitle}>{t("ai.marketDemand")}</div>
                  <div style={s.emptySub}>{t("ai.marketPlaceholder")}</div>
                </div>
              )}
              {marketData && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {marketData.marketInsight && (
                    <div style={{ background:"linear-gradient(135deg,#1C3A0E,#2d5a1a)", borderRadius:"12px", padding:"1.25rem", color:"white" }}>
                      <div style={{ fontSize:"18px", marginBottom:"6px" }}>💡</div>
                      <div style={{ fontSize:"13px", lineHeight:1.6, opacity:0.9 }}>{marketData.marketInsight}</div>
                    </div>
                  )}
                  {marketData.crops?.map((c, i) => {
                    const dc = DEMAND_COLOR[c.demand] || DEMAND_COLOR.Medium;
                    const trendColor = c.trend === "Rising" ? "#3B6D11" : c.trend === "Falling" ? "#A32D2D" : "#888";
                    const trendIcon  = c.trend === "Rising" ? "↑" : c.trend === "Falling" ? "↓" : "→";
                    return (
                      <div key={i} style={s.resultCard}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px", flexWrap:"wrap", gap:"8px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                            <span style={{ fontSize:"20px" }}>{CROP_ICONS[c.name] || "🌿"}</span>
                            <div style={{ fontWeight:600, fontSize:"15px" }}>{c.name}</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:500, background:dc.bg, color:dc.color }}>
                            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:dc.dot, display:"inline-block" }} />
                            {c.demand}
                          </div>
                        </div>
                        <div className="ai-market-3col">
                          {[["💰", c.currentPrice, "#1a1a1a"],["📈", `${trendIcon} ${c.trend}`, trendColor],["🗓️", c.bestTimeToSell, "#1a1a1a"]].map(([icon, val, color], j) => (
                            <div key={j} style={{ background:"#F7F6F3", borderRadius:"8px", padding:"8px 10px" }}>
                              <div style={{ fontSize:"14px", marginBottom:"3px" }}>{icon}</div>
                              <div style={{ fontSize:"11px", fontWeight:600, color }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:"12px", color:"#555", background:"#F7F6F3", borderRadius:"8px", padding:"8px 10px", lineHeight:1.5 }}>{c.advice}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  heroGlow:       { position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 80% 20%, rgba(151,196,89,0.15) 0%, transparent 60%)" },
  heroContent:    { position:"relative", maxWidth:"1100px", margin:"0 auto" },
  heroBadge:      { display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(151,196,89,0.2)", border:"0.5px solid rgba(151,196,89,0.4)", borderRadius:"20px", padding:"5px 14px", fontSize:"11px", color:"#97C459", marginBottom:"16px", fontWeight:500 },
  heroTitle:      { fontFamily:"'DM Serif Display', serif", fontSize:"36px", color:"white", margin:"0 0 10px", lineHeight:1.2 },
  heroSub:        { fontSize:"14px", color:"rgba(255,255,255,0.65)", margin:"0 0 24px", maxWidth:"500px", lineHeight:1.6 },
  tabCard:        { background:"white", borderRadius:"14px", border:"0.5px solid #E8E6E0", padding:"1.25rem", cursor:"pointer", textAlign:"left", position:"relative", transition:"all 0.2s", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", fontFamily:"inherit" },
  tabCardActive:  { border:"1.5px solid #3B6D11", boxShadow:"0 4px 16px rgba(59,109,17,0.15)" },
  tabCardIcon:    { fontSize:"28px", marginBottom:"8px", display:"block" },
  tabCardLabel:   { fontSize:"13px", fontWeight:600, color:"#1a1a1a", marginBottom:"3px" },
  tabCardDesc:    { fontSize:"11px", color:"#888", lineHeight:1.4 },
  activeDot:      { position:"absolute", top:"12px", right:"12px", width:"8px", height:"8px", borderRadius:"50%", background:"#3B6D11" },
  panelHeader:    { display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" },
  panelIconBox:   { width:"40px", height:"40px", background:"#EAF3DE", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 },
  panelTitle:     { fontSize:"15px", fontWeight:600, color:"#1a1a1a" },
  panelSub:       { fontSize:"11px", color:"#888", lineHeight:1.4, maxWidth:"220px" },
  inputCard:      { background:"white", borderRadius:"14px", border:"0.5px solid #E8E6E0", padding:"1.25rem", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  field:          { marginBottom:"14px" },
  label:          { display:"block", fontSize:"11px", fontWeight:600, color:"#555", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.05em" },
  input:          { width:"100%", padding:"10px 12px", borderRadius:"8px", border:"0.5px solid #DDD", fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"white", color:"#1a1a1a" },
  seasonBtn:      { padding:"8px 4px", borderRadius:"8px", border:"0.5px solid #DDD", background:"white", fontSize:"11px", cursor:"pointer", fontFamily:"inherit", color:"#555", textAlign:"center" },
  seasonBtnActive:{ background:"#EAF3DE", border:"0.5px solid #97C459", color:"#27500A", fontWeight:600 },
  aiBtn:          { width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#3B6D11,#2d5a1a)", color:"white", fontSize:"13px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:"4px" },
  errBox:         { background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:"8px", padding:"10px", fontSize:"12px", color:"#791F1F", marginBottom:"10px" },
  emptyState:     { background:"white", borderRadius:"14px", border:"0.5px solid #E8E6E0", padding:"3rem 2rem", textAlign:"center" },
  emptyTitle:     { fontSize:"15px", fontWeight:600, color:"#1a1a1a", marginBottom:"6px" },
  emptySub:       { fontSize:"13px", color:"#888", lineHeight:1.6, maxWidth:"280px", margin:"0 auto" },
  resultCard:     { background:"white", borderRadius:"12px", border:"0.5px solid #E8E6E0", padding:"1.1rem", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
  resultHeader:   { display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" },
  rIcon:          { fontSize:"18px" },
  rTitle:         { fontSize:"13px", fontWeight:600, color:"#1a1a1a" },
  cropItem:       { padding:"10px 10px 10px 12px", borderRadius:"8px", background:"#FAFAF8", marginBottom:"8px" },
  cropName:       { fontSize:"14px", fontWeight:600, color:"#1a1a1a", marginBottom:"4px" },
  cropReason:     { fontSize:"12px", color:"#555", lineHeight:1.5 },
  metaPill:       { fontSize:"10px", padding:"3px 8px", borderRadius:"6px", background:"#F0EEE9", color:"#555", whiteSpace:"nowrap" },
  fertTag:        { fontSize:"10px", padding:"2px 8px", borderRadius:"6px", background:"#F0EEE9", color:"#555" },
  eqChip:         { fontSize:"11px", padding:"4px 10px", borderRadius:"8px", background:"#EAF3DE", color:"#27500A", fontWeight:500 },
  cropToggle:     { padding:"6px 12px", borderRadius:"20px", border:"0.5px solid #DDD", background:"white", color:"#555", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" },
  cropToggleActive:{ background:"#EAF3DE", border:"0.5px solid #97C459", color:"#27500A", fontWeight:600 },
};