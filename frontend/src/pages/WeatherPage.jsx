import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useTranslation } from "react-i18next";

const WEATHER_ICONS = {
  "01d":"☀️","01n":"🌙","02d":"⛅","02n":"⛅","03d":"☁️","03n":"☁️",
  "04d":"☁️","04n":"☁️","09d":"🌧️","09n":"🌧️","10d":"🌦️","10n":"🌧️",
  "11d":"⛈️","11n":"⛈️","13d":"❄️","13n":"❄️","50d":"🌫️","50n":"🌫️",
};

export default function WeatherPage() {
  const { authFetch, user } = useAuth();
  const { t } = useTranslation();

  const [city, setCity]         = useState(user?.farmLocation || "Lucknow");
  const [search, setSearch]     = useState(user?.farmLocation || "Lucknow");
  const [current, setCurrent]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const fetchWeather = async (cityName) => {
    setLoading(true); setError("");
    try {
      const [curRes, fcRes] = await Promise.all([
        authFetch(`/api/weather/current?city=${encodeURIComponent(cityName)}`),
        authFetch(`/api/weather/forecast?city=${encodeURIComponent(cityName)}`),
      ]);
      const curData = await curRes.json();
      const fcData  = await fcRes.json();
      if (!curRes.ok) throw new Error(curData.message);
      setCurrent(curData.weather);
      setForecast(fcData.forecast || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeather(city); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCity(search);
    fetchWeather(search);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{t("weather.title")}</h1>
          <p style={s.sub}>{t("weather.subtitle")}</p>
        </div>
      </div>

      {/* City search */}
      <form onSubmit={handleSearch} style={s.searchBar}>
        <input style={s.searchInput} placeholder={t("weather.searchPlaceholder")} value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" style={s.searchBtn}>{t("weather.search")}</button>
      </form>

      {error && <div style={s.errBox}>{error}</div>}
      {loading && <div style={s.center}>{t("common.loading")}</div>}

      {!loading && current && (
        <>
          {/* Current weather card */}
          <div style={s.currentCard}>
            <div style={s.currentLeft}>
              <div style={s.weatherIcon}>{WEATHER_ICONS[current.icon] || "🌤️"}</div>
              <div>
                <div style={s.tempText}>{current.temp}°C</div>
                <div style={s.cityName}>{current.city}</div>
                <div style={s.weatherDesc}>{current.description}</div>
              </div>
            </div>
            <div style={s.currentRight}>
              <div style={s.statGrid}>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.feelsLike")}</div><div style={s.statVal}>{current.feelsLike}°C</div></div>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.humidity")}</div><div style={s.statVal}>{current.humidity}%</div></div>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.wind")}</div><div style={s.statVal}>{current.windSpeed} km/h</div></div>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.visibility")}</div><div style={s.statVal}>{current.visibility} km</div></div>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.sunrise")}</div><div style={s.statVal}>{current.sunrise}</div></div>
                <div style={s.stat}><div style={s.statLabel}>{t("weather.sunset")}</div><div style={s.statVal}>{current.sunset}</div></div>
              </div>
            </div>
          </div>

          {/* Farming advisory */}
          {current.farmingAdvice?.length > 0 && (
            <div style={s.advisoryCard}>
              <div style={s.advisoryTitle}>{t("weather.farmingAdvisory")}</div>
              <div style={s.advisoryGrid}>
                {current.farmingAdvice.map((tip, i) => (
                  <div key={i} style={{ ...s.advisoryTip, ...(tip.startsWith("⚠️") ? s.tipWarn : tip.startsWith("❄️") || tip.startsWith("🌡️") ? s.tipDanger : s.tipGood) }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-day forecast */}
          {forecast.length > 0 && (
            <div style={s.forecastCard}>
              <div style={s.forecastTitle}>{t("weather.fiveDayForecast")}</div>
              <div style={s.forecastGrid}>
                {forecast.map((day, i) => (
                  <div key={i} style={{ ...s.forecastDay, ...(i === 0 ? s.forecastDayActive : {}) }}>
                    <div style={s.dayLabel}>{day.day}</div>
                    <div style={s.dayIcon}>{WEATHER_ICONS[day.icon] || "🌤️"}</div>
                    <div style={s.dayTemp}>{day.temp}°C</div>
                    <div style={s.dayMinMax}>{day.tempMin}° / {day.tempMax}°</div>
                    <div style={s.rainChance}>
                      <span style={{ color: day.rainChance > 50 ? "#185FA5" : "#AAA" }}>
                        💧 {day.rainChance}%
                      </span>
                    </div>
                    <div style={s.humidity}>💨 {day.humidity}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  page:              { padding:"2rem", maxWidth:"900px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  header:            { marginBottom:"1.25rem" },
  title:             { fontFamily:"'DM Serif Display', serif", fontSize:"26px", margin:"0 0 4px", color:"var(--text)" },
  sub:               { fontSize:"13px", color:"var(--text3)", margin:0 },
  searchBar:         { display:"flex", gap:"10px", marginBottom:"1.5rem" },
  searchInput:       { flex:1, padding:"10px 14px", borderRadius:"8px", border:"0.5px solid var(--border)", fontSize:"14px", fontFamily:"inherit", outline:"none", background:"var(--bg2)", color:"var(--text)" },
  searchBtn:         { padding:"10px 20px", borderRadius:"8px", border:"none", background:"#3B6D11", color:"white", fontSize:"13px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" },
  errBox:            { background:"#FCEBEB", border:"0.5px solid #F09595", borderRadius:"8px", padding:"12px 16px", color:"#791F1F", fontSize:"13px", marginBottom:"1rem" },
  center:            { textAlign:"center", padding:"3rem", color:"var(--text3)" },
  currentCard:       { background:"#1C3A0E", borderRadius:"16px", padding:"1.75rem", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"20px" },
  currentLeft:       { display:"flex", alignItems:"center", gap:"16px" },
  weatherIcon:       { fontSize:"56px" },
  tempText:          { fontFamily:"'DM Serif Display', serif", fontSize:"52px", color:"white", lineHeight:1 },
  cityName:          { fontSize:"16px", fontWeight:500, color:"rgba(255,255,255,0.9)", marginBottom:"2px" },
  weatherDesc:       { fontSize:"13px", color:"rgba(255,255,255,0.6)", textTransform:"capitalize" },
  currentRight:      {},
  statGrid:          { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" },
  stat:              { textAlign:"center" },
  statLabel:         { fontSize:"10px", color:"rgba(255,255,255,0.5)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.06em" },
  statVal:           { fontSize:"14px", fontWeight:500, color:"white" },
  advisoryCard:      { background:"var(--bg2)", borderRadius:"12px", border:"0.5px solid var(--border)", padding:"1.25rem", marginBottom:"1rem" },
  advisoryTitle:     { fontSize:"14px", fontWeight:500, marginBottom:"12px", color:"var(--text)" },
  advisoryGrid:      { display:"flex", flexDirection:"column", gap:"8px" },
  advisoryTip:       { padding:"10px 14px", borderRadius:"8px", fontSize:"13px" },
  tipGood:           { background:"#EAF3DE", color:"#27500A" },
  tipWarn:           { background:"#FAEEDA", color:"#633806" },
  tipDanger:         { background:"#FCEBEB", color:"#791F1F" },
  forecastCard:      { background:"var(--bg2)", borderRadius:"12px", border:"0.5px solid var(--border)", padding:"1.25rem" },
  forecastTitle:     { fontSize:"14px", fontWeight:500, marginBottom:"14px", color:"var(--text)" },
  forecastGrid:      { display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:"10px" },
  forecastDay:       { textAlign:"center", padding:"14px 8px", borderRadius:"10px", background:"var(--bg3)", border:"0.5px solid var(--border)" },
  forecastDayActive: { background:"var(--green-light)", border:"0.5px solid #97C459" },
  dayLabel:          { fontSize:"11px", fontWeight:500, color:"var(--text2)", marginBottom:"8px" },
  dayIcon:           { fontSize:"26px", marginBottom:"6px" },
  dayTemp:           { fontSize:"18px", fontWeight:500, color:"var(--text)", marginBottom:"2px" },
  dayMinMax:         { fontSize:"11px", color:"var(--text3)", marginBottom:"6px" },
  rainChance:        { fontSize:"11px", marginBottom:"3px" },
  humidity:          { fontSize:"11px", color:"var(--text3)" },
};