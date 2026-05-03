# FarmLink — Agriculture Management System
## Final Year Project

A full-stack MERN application that enables farmers to rent equipment, browse products,
get AI-powered crop advice, and access weather forecasts.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, i18next  |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB Atlas + Mongoose            |
| Auth      | JWT (JSON Web Tokens) + bcryptjs    |
| Payments  | Razorpay                            |
| AI        | Google Gemini 1.5 Flash             |
| Weather   | OpenWeatherMap API                  |
| Languages | English, Hindi (हिंदी), Marathi (मराठी) |

---

## Project Structure

```
farmlink/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT verification + role guards
│   ├── models/
│   │   ├── User.js              # Farmer / Vendor / Admin
│   │   ├── Equipment.js         # Equipment listings
│   │   ├── Booking.js           # Equipment rentals
│   │   ├── Product.js           # Marketplace products
│   │   └── Order.js             # Product orders
│   ├── routes/
│   │   ├── auth.js              # Register, login, profile
│   │   ├── equipment.js         # CRUD + availability check
│   │   ├── bookings.js          # Book, confirm, cancel, review
│   │   ├── products.js          # Product marketplace
│   │   ├── admin.js             # Admin controls
│   │   ├── payments.js          # Razorpay integration
│   │   ├── ai.js                # Gemini AI endpoints
│   │   └── weather.js           # OpenWeatherMap endpoints
│   ├── server.js                # Express app entry point
│   ├── package.json
│   └── .env.example             # Copy to .env and fill in
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               # All routes
        ├── components/
        │   ├── AuthContext.jsx   # Global auth state
        │   ├── ProtectedRoute.jsx
        │   ├── Navbar.jsx        # Role-based navigation
        │   ├── EquipmentCard.jsx
        │   ├── LanguageSwitcher.jsx
        │   └── useRazorpay.js    # Razorpay hook
        ├── i18n/
        │   ├── i18n.js
        │   └── locales/
        │       ├── en.json       # English
        │       ├── hi.json       # Hindi
        │       └── mr.json       # Marathi
        └── pages/
            ├── AuthPage.jsx
            ├── FarmerDashboard.jsx
            ├── VendorDashboard.jsx
            ├── EquipmentPage.jsx
            ├── EquipmentDetailPage.jsx
            ├── AddEquipmentPage.jsx
            ├── BookingsPage.jsx
            ├── PaymentPage.jsx
            ├── AIAdvisorPage.jsx
            ├── WeatherPage.jsx
            ├── ProfilePage.jsx
            └── admin/
                ├── AdminPage.jsx
                ├── AdminVendors.jsx
                ├── AdminUsers.jsx
                ├── AdminListings.jsx
                └── AdminTransactions.jsx
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier is fine)
- Razorpay account (test mode)
- Google AI Studio account (for Gemini API)
- OpenWeatherMap account (free tier)

---

### Step 1 — Backend Setup

```bash
cd farmlink/backend
npm install
cp .env.example .env
```

Edit `.env` with your actual credentials:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/farmlink
JWT_SECRET=any_long_random_string
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
GEMINI_API_KEY=AIzaSy_xxxx
OPENWEATHER_API_KEY=xxxx
```

⚠️ If your MongoDB password has special characters (e.g. @, #), encode them:
- @ → %40
- # → %23

Start the backend:
```bash
npm start
```

You should see:
```
✅ MongoDB connected
✅ Server running on port 5000
```

---

### Step 2 — Frontend Setup

Open a second terminal:
```bash
cd farmlink/frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

### Step 3 — Create Admin Account

Read ADMIN_SETUP.txt for full instructions. Quick version:

1. Create `farmlink/backend/createAdmin.js`:
```js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.create({
    name: "FarmLink Admin",
    email: "admin@farmlink.com",
    phone: "9999999999",
    password: "Admin@1234",
    role: "admin",
  });
  console.log("✅ Admin created");
  process.exit(0);
});
```

2. Run: `node createAdmin.js`
3. Delete the file immediately
4. Login at http://localhost:5173 with admin@farmlink.com / Admin@1234

---

## API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/register | Register farmer or vendor | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Get current user | JWT |
| PATCH | /api/auth/profile | Update profile | JWT |
| PATCH | /api/auth/change-password | Change password | JWT |
| GET | /api/equipment | Browse equipment | JWT |
| POST | /api/equipment | Create listing | JWT |
| GET | /api/equipment/:id | Equipment detail | JWT |
| GET | /api/equipment/:id/availability | Check dates | JWT |
| GET | /api/equipment/my/listings | My listings | JWT |
| POST | /api/bookings | Create booking | JWT |
| GET | /api/bookings/my | My rentals | JWT |
| GET | /api/bookings/incoming | Incoming requests | JWT |
| PATCH | /api/bookings/:id/confirm | Confirm booking | JWT |
| PATCH | /api/bookings/:id/cancel | Cancel booking | JWT |
| PATCH | /api/bookings/:id/complete | Mark complete | JWT |
| POST | /api/bookings/:id/review | Leave review | JWT |
| GET | /api/products | Browse products | JWT |
| POST | /api/payments/booking/create-order | Initiate payment | JWT |
| POST | /api/payments/booking/verify | Verify payment | JWT |
| POST | /api/ai/crop-advice | AI crop recommendation | JWT |
| POST | /api/ai/disease-detect | Crop disease detection | JWT |
| POST | /api/ai/market-demand | Market price forecast | JWT |
| GET | /api/weather/current | Current weather | JWT |
| GET | /api/weather/forecast | 5-day forecast | JWT |
| GET | /api/admin/stats | Platform overview | Admin |
| GET | /api/admin/vendors/pending | Pending vendors | Admin |
| PATCH | /api/admin/vendors/:id/approve | Approve vendor | Admin |
| PATCH | /api/admin/vendors/:id/reject | Reject vendor | Admin |
| GET | /api/admin/users | All users | Admin |
| PATCH | /api/admin/users/:id/suspend | Suspend user | Admin |
| DELETE | /api/admin/listings/:id | Remove listing | Admin |

---

## User Roles

| Role | Access | Dashboard |
|------|--------|-----------|
| Farmer | Browse equipment, rent, list own equipment (P2P), AI advisor, weather | /farmer-dashboard |
| Vendor | Unlimited listings, booking management, revenue tracking | /vendor-dashboard |
| Admin | Approve vendors, manage users, moderate listings, view transactions | /admin |

---

## Features

- ✅ JWT Authentication with role-based access
- ✅ Equipment rental (vendor + P2P farmer listings)
- ✅ Booking flow with conflict detection
- ✅ Razorpay payment integration (UPI, cards, net banking)
- ✅ Gemini AI — crop advice, disease detection, market demand
- ✅ OpenWeatherMap — current weather + 5-day forecast + farming advisory
- ✅ Multi-language — English, Hindi, Marathi
- ✅ Admin panel — vendor approval, user management, listing moderation
- ✅ Farmer dashboard with earnings chart
- ✅ Vendor dashboard with revenue breakdown and booking confirm/reject
- ✅ Profile management with password change
