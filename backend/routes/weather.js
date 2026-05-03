const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();
const BASE   = "https://api.openweathermap.org/data/2.5";
const KEY    = () => process.env.OPENWEATHER_API_KEY;

// Helper — convert Kelvin to Celsius
const toCelsius = (k) => Math.round(k - 273.15);

// Helper — map weather condition to farming advice
const farmingAdvice = (weather, temp, humidity) => {
  const tips = [];
  const desc = weather.toLowerCase();

  if (desc.includes("rain"))   tips.push("⚠️ Delay pesticide/fertilizer application — rain will wash it away");
  if (desc.includes("clear") && temp > 30) tips.push("💧 High temperature — increase irrigation frequency");
  if (desc.includes("clear"))  tips.push("✅ Good day for field work, spraying and harvesting");
  if (humidity > 80)           tips.push("⚠️ High humidity — watch for fungal diseases on crops");
  if (humidity < 30)           tips.push("💧 Low humidity — crops may need extra watering");
  if (temp < 10)               tips.push("❄️ Cold weather — protect sensitive crops from frost");
  if (temp > 35)               tips.push("🌡️ Very hot — irrigate early morning or evening only");
  if (tips.length === 0)       tips.push("✅ Weather conditions are suitable for normal farm activities");

  return tips;
};

// ─── GET /api/weather/current?city=Lucknow ────────────────────────────────
router.get("/current", protect, async (req, res) => {
  try {
    const city = req.query.city || "Lucknow";
    const url  = `${BASE}/weather?q=${encodeURIComponent(city)},IN&appid=${KEY()}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.cod !== 200) {
      return res.status(400).json({ message: `City "${city}" not found. Try another city name.` });
    }

    const weather = {
      city:        data.name,
      state:       data.sys?.country,
      temp:        toCelsius(data.main.temp),
      feelsLike:   toCelsius(data.main.feels_like),
      humidity:    data.main.humidity,
      windSpeed:   Math.round(data.wind.speed * 3.6), // m/s to km/h
      description: data.weather[0].description,
      icon:        data.weather[0].icon,
      visibility:  Math.round((data.visibility || 0) / 1000),
      sunrise:     new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      sunset:      new Date(data.sys.sunset  * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      farmingAdvice: farmingAdvice(data.weather[0].description, toCelsius(data.main.temp), data.main.humidity),
    };

    res.json({ weather });
  } catch (err) {
    console.error("Weather current error:", err);
    res.status(500).json({ message: "Weather service unavailable. Please try again." });
  }
});

// ─── GET /api/weather/forecast?city=Lucknow ───────────────────────────────
// Returns 5-day forecast grouped by day
router.get("/forecast", protect, async (req, res) => {
  try {
    const city = req.query.city || "Lucknow";
    const url  = `${BASE}/forecast?q=${encodeURIComponent(city)},IN&appid=${KEY()}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.cod !== "200") {
      return res.status(400).json({ message: `City "${city}" not found.` });
    }

    // Group forecast by day (take the noon reading for each day)
    const days = {};
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const key  = date.toISOString().split("T")[0];
      const hour = date.getHours();

      // Prefer the 12:00 or 15:00 reading for each day
      if (!days[key] || hour === 12 || (hour === 15 && days[key].hour !== 12)) {
        days[key] = {
          date,
          hour,
          day:         date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
          temp:        toCelsius(item.main.temp),
          tempMin:     toCelsius(item.main.temp_min),
          tempMax:     toCelsius(item.main.temp_max),
          humidity:    item.main.humidity,
          description: item.weather[0].description,
          icon:        item.weather[0].icon,
          rainChance:  Math.round((item.pop || 0) * 100),
          windSpeed:   Math.round(item.wind.speed * 3.6),
        };
      }
    });

    const forecast = Object.values(days).slice(0, 5);
    res.json({ city, forecast });
  } catch (err) {
    console.error("Weather forecast error:", err);
    res.status(500).json({ message: "Weather service unavailable." });
  }
});

module.exports = router;
