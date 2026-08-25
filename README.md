# 🍽️ FoodLoop — Intelligent Food Recovery Platform

> **Recovering Food. Restoring Hope.**

FoodLoop is an intelligent food recovery and waste-management platform that connects **food donors, receivers, waste processors, and administrators** through smart matching, partial allocation, food-safety tracking, logistics tracking, in-app notifications, and automated recovery workflows.

The platform is designed to help restaurants, hotels, supermarkets, NGOs, shelters, orphanages, compost facilities, and biogas plants coordinate food recovery and organic-waste diversion through one unified system.

---

## 🌐 Live Demo

**Website:** https://foodloop-nu.vercel.app/

**GitHub Repository:** https://github.com/KalviinJoshua/Food-Loop

---

## 🎯 What is FoodLoop?

Every day, large quantities of edible food are wasted while organizations and communities struggle to access sufficient food. FoodLoop addresses this problem by creating a digital recovery network.

```text
                     FoodLoop
                        │
          ┌─────────────┼─────────────┐
          │             │             │
        DONOR        RECEIVER      PROCESSOR
          │             │             │
          └────── Smart Matching ─────┘
                        │
                        ▼
                 Partial Allocation
                        │
                        ▼
                 Pickup & Delivery
                        │
                        ▼
                  Food Recovery
                        │
                        ▼
                 Impact Tracking
```

If food reaches its safety limit before it can be redistributed:

```text
Food Donation
      │
      ▼
Safety Countdown
      │
      ├── Food still safe ──► Receiver Matching
      │
      └── Expired ──────────► Waste Management
                                  │
                                  ▼
                          Compost / Biogas
```

---

# ✨ Key Features

## 🍱 1. Food Donation Management

Donors can create food donation posts containing:

* Food quantity
* Food description
* Preparation information
* Safe-until time
* Allergens
* Delivery radius
* Pickup information
* Food suitability

Donations are tracked throughout their recovery lifecycle:

```text
Posted
   ↓
Matching
   ↓
Partially / Fully Allocated
   ↓
Receiver Matched
   ↓
Pickup Scheduled
   ↓
Picked Up
   ↓
Delivered
   ↓
Completed
```

If the food-safety window expires:

```text
Expired
   ↓
Waste Management
```

---

## ⏱️ 2. Food Safety Countdown

FoodLoop includes a live food-safety countdown for time-sensitive donations.

```text
🍛 Food Available
300 meals

⏳ Food valid for:
01:24:32

Status: 🟢 SAFE
```

As expiry approaches:

```text
⏳ 00:14:32
🔴 CRITICAL
```

After the safety window expires:

```text
⚠️ Recovery Window Expired
♻️ Remaining food routed toward waste management
```

The countdown is derived from the donation's `safeUntil` timestamp rather than a timer that resets on refresh, so the state is stable across page reloads.

### Expiry States

| Remaining Time         | Status        |
| ---------------------- | ------------  |
| More than 60 minutes   | 🟢 Available |
| 15 – 60 minutes        | 🟡 Urgent    |
| Less than 15 minutes   | 🔴 Critical  |
| 0 or below             | ⚫ Expired   |

Expired food is removed from normal receiver matching while its history is preserved.

---

## 🤖 3. AI-Powered Smart Matching

FoodLoop uses a hybrid matching architecture.

### Deterministic Matching

Receivers are ranked using five weighted factors:

| Factor                  |   Weight |
| ----------------------- | -------: |
| Distance                |    40%   |
| Quantity Compatibility  |    25%   |
| Transport Compatibility |    15%   |
| Food Compatibility      |    10%   |
| Reliability             |    10%   |
| **Total**               | **100%** |

The system considers geographic distance, receiver demand, transport availability, food/dietary suitability, and partner reliability.

```text
Best Match
Chennai Children's NGO

Match Score:       92%
Distance:          2.4 km
Estimated Travel:  ~12 min
Food Suitability:  95%
Transport:         Available
Reliability:       96%
```

### Google Gemini

Google Gemini (`gemini-2.5-flash`) enhances matching and AI assistance by providing match reasoning, partner recommendations, AI-assisted analysis, and recovery/waste-diversion guidance.

If Gemini is unavailable (no API key or a service error), FoodLoop automatically falls back to the deterministic matching engine — the app keeps working.

---

## 🗺️ 4. Map-Based Matching

FoodLoop provides a geographic matching interface that displays donors and receivers on a map-based visualization.

```text
        📍Donor
           │
        2.4 km
           │
           ▼
        📍NGO
```

The map provides donor/receiver locations, distance, estimated travel time, pickup and delivery locations, match score, the match-score breakdown, receiver selection, and route visualization.

Distance is calculated from geographic coordinates using the **Haversine formula**. Travel time is an **estimate** derived from distance — the prototype does not use live traffic routing.

### Match-Score Breakdown

```text
Distance          38 / 40
Quantity          23 / 25
Transport         14 / 15
Food suitability   9 / 10
Reliability        8 / 10
--------------------------
Total             92 / 100
```

---

## 🔀 5. Partial Allocation — Auto-Split

FoodLoop can distribute one donation across multiple receivers.

```text
Donation: 300 meals

Receiver A → needs 80
Receiver B → needs 120
Receiver C → needs 150
```

The system automatically calculates:

```text
Receiver A → 80
Receiver B → 120
Receiver C → 100

Total Allocated → 300
Remaining → 0
```

The allocation engine ensures:

* A receiver never receives more than required.
* Total allocation never exceeds available food.
* Higher-ranked matches are considered first.
* Remaining receiver demand is respected.
* Duplicate allocation is prevented.

This lets one donor serve multiple organizations instead of requiring a single receiver to accept the entire donation.

---

## 🚚 6. Pickup & Delivery Tracking

FoodLoop includes a status-based logistics tracking system.

```text
Donation Created       ✓
        ↓
Receiver Matched       ✓
        ↓
Pickup Scheduled       ✓
        ↓
Food Picked Up         ●
        ↓
Food Delivered
```

**Core tracking states:** `donation_created`, `receiver_matched`, `pickup_scheduled`, `picked_up`, `delivered`.

**Additional states:** `cancelled`, `expired`, `waste_management`.

The timeline tracks the current status, pickup/delivery locations, estimated pickup/delivery times, and which steps are completed, current, or upcoming.

The prototype uses status-based tracking rather than real-time GPS tracking.

---

## 🔔 7. In-App Notifications

FoodLoop provides an in-app notification center.

```text
🔔 New receiver matched your donation
🔔 Your food expires in 30 minutes
🔔 Receiver accepted 80 meals
🔔 Pickup scheduled for 6:30 PM
🔔 50 meals remain unallocated
```

**Features:** unread count, dropdown, mark as read, mark all as read, clear notifications, categories, relative timestamps, and click-through navigation.

**Supported categories:** `match`, `expiry_warning`, `allocation`, `pickup`, `delivery`, `waste_management`, `system`.

Notification state is currently maintained in the browser and is structured for future database persistence.

---

## 👥 8. Role-Based Dashboards

FoodLoop provides a different experience per role.

### 🟢 Donor
Create food donations and organic-waste posts, view smart matches, view allocation info, track the donation lifecycle, view receiver information, monitor the food-safety countdown, track pickup and delivery, view recovery impact, and rate partners.

### 🔵 Receiver
Discover available food, view nearby donors, use map-based matching, view match scores, request food, accept complete or partial allocations, track collections and pickup/delivery, complete rescues, and rate donors.

### 🟤 Waste Processor
View expired food and organic-waste opportunities, view remaining quantities, review suitable waste, track waste-processing workflows, and manage composting/biogas recovery.

### 🔴 Admin
Monitor the platform through an administrative dashboard: system statistics, user monitoring, user verification, role statistics, and recent-donation monitoring. The admin dashboard is **role-protected** so normal users cannot access the administrator interface.

---

## 🔐 9. Authentication

FoodLoop supports role-based application authentication and integrates **Supabase Authentication**.

```text
Email + Password
      ↓
Supabase Auth
      ↓
Authenticated Session
      ↓
FoodLoop User
      ↓
Role-Based Dashboard
```

Supabase email/password sign-in activates automatically when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. If they are not set, the app transparently falls back to the existing demo/local login — nothing breaks. New-user registration is persisted server-side in Supabase.

### Security Boundary

Browser-side code uses **only public Supabase credentials** (the publishable/anon key). Privileged secrets remain server-side and must **never** be exposed to frontend code or given a `VITE_` prefix:

* `SUPABASE_SERVICE_ROLE_KEY`
* `GEMINI_API_KEY`

---

## 📄 10. FSSAI Document Verification

FoodLoop includes FSSAI certificate processing as part of donor registration, handled **server-side and deterministically** (no AI required).

Uploads are validated first (`multer`: PDF / JPG / JPEG / PNG only, max 10 MB, single file). Text is then extracted with `pdf-parse` (PDFs) or `tesseract.js` OCR (images), and the system attempts to extract:

* FSSAI number
* Organization name
* Address
* License information
* Expiry information

Extracted values are compared against the registration details. Possible verification states:

```text
Verified
Pending Review
Invalid
Expired
Document Unreadable
```

---

## ⭐ 11. Rating & Reliability System

After completed food-recovery operations, participants can rate their partners.

* **Rating:** 1–5 stars
* **Reliability:** 50–100%

Ratings and reliability feed back into future matching:

```text
Successful Rescue
       ↓
Partner Rating
       ↓
Reliability Update
       ↓
Better Future Matching
```

---

## ♻️ 12. Organic Waste Recovery

FoodLoop handles food that is no longer suitable for human consumption.

```text
Expired Food
      ↓
Waste Management
      ↓
Waste Processor Matching
      ↓
Capacity Verification
      ↓
Processor Selection
      ↓
Pickup
      ↓
Processing
      ↓
Waste Diverted
```

```text
Organic Waste
     ├── Composting
     └── Biogas
```

The system preserves the original donation history instead of deleting expired food.

---

## 🤖 13. FoodLoop AI Advisor

FoodLoop includes an AI-powered advisor using Google Gemini (`gemini-2.5-flash`). It assists with food-recovery decisions, donation optimization, matching considerations, waste diversion, and platform workflows. Conversation history is persisted locally, and the system includes fallback handling when the AI service is unavailable.

---

## 📊 14. Impact Monitoring

FoodLoop is designed to support platform-level impact monitoring. Potential metrics include:

* 🍛 Meals Rescued
* ♻️ Food Waste Diverted
* 👥 Organizations Helped
* 🚚 Successful Deliveries
* 🏭 Waste Processed

These can be expanded into a full analytics dashboard as more operational data is persisted.

---

# 🏗️ Architecture

```text
                          FoodLoop
                             │
              ┌──────────────┴──────────────┐
              │                             │
         React Frontend                Express Backend
              │                             │
              │                           Node.js
              │                             │
        React Context                     APIs
              │                             │
      Local Application State           Supabase
              │                             │
              └──────────────┬──────────────┘
                             │
                       Google Gemini
                             │
                    AI Matching / Advisor
```

**Frontend** handles the UI, role-based dashboards, map visualization, matching display, countdown, tracking timeline, notifications, and user interactions.

**Backend** handles API routes, server-side Supabase operations, FSSAI verification, Gemini API access, user persistence, and AI-related processing.

**Database** — Supabase PostgreSQL provides persistent user data and the foundation for future operational data.

---

# 🔌 Backend API

The Express backend exposes:

| Route                    | Method | Purpose                                                        |
| ------------------------ | ------ | -------------------------------------------------------------- |
| `/api/ai-matching`       | POST   | Gemini smart-match ranking + partial-allocation plan           |
| `/api/ai-chat`           | POST   | Gemini AI Recovery Advisor chat                                |
| `/api/verify-fssai`      | POST   | FSSAI certificate upload, text extraction, and verification    |
| `/api/status`            | GET    | Health check; reports the active AI provider                   |
| `/api/db-test`           | GET    | Supabase connectivity test                                     |
| `/api/users`             | POST   | Create a new user in Supabase                                  |

The `/api/ai-matching` and `/api/ai-chat` endpoints require a Gemini key and return `503` when the AI client is unavailable (the frontend then uses its deterministic fallback). Privileged operations (Supabase service-role access, Gemini access, FSSAI processing) all stay on the backend.

---

# 🗄️ Database

Supabase PostgreSQL currently stores persistent user-registration data. The `users` table includes:

```text
id, role, organization_name, contact_person, phone, email, address,
latitude, longitude, rating, rating_count, reliability,
fssai_number, gstin, daily_meals_required, dietary_needs, facility_type,
verified, verification_status, certificate_uploaded,
extracted_fssai_number, certificate_expiry_date, verification_timestamp,
created_at, updated_at
```

Additional operational tables can be introduced later:

```text
donations
allocations
tracking_events
notifications
waste_processing
```

This allows the current prototype architecture to evolve into a fully database-backed multi-user platform.

---

# 🛠️ Technology Stack

**Frontend:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · Motion (Framer Motion) · Lucide React + Google Material Symbols

**Backend:** Node.js · Express 4 · TypeScript · tsx

**Database & Auth:** Supabase · PostgreSQL · Supabase Authentication (email/password) with demo/local fallback

**AI:** Google Gemini (`@google/genai`) · `gemini-2.5-flash`

**State Management:** React Context API · local application state · `localStorage`

**Document Processing:** `multer` (upload handling) · `pdf-parse` (PDF text) · `tesseract.js` (OCR for images)

**Geographic Features:** latitude/longitude location data · Haversine distance calculation · estimated travel-time calculation · map-based matching visualization

---

# 📂 Project Structure

```text
Food-Loop/
│
├── api/
│   └── index.ts                # Vercel serverless entry
│
├── server/
│   └── supabase.ts             # Server-side Supabase client (service role)
│
├── src/
│   ├── components/
│   │   ├── ai/                 # AI Advisor widget
│   │   ├── auth/               # Login modal, registration
│   │   ├── common/             # SafetyCountdown, shared UI
│   │   ├── dashboard/          # Donor / Receiver / WasteProcessor / Admin
│   │   ├── footer/
│   │   ├── landing/
│   │   ├── map/                # MapView (geographic matching)
│   │   ├── navbar/             # TopNavBar
│   │   ├── notifications/      # NotificationCenter
│   │   ├── ratings/
│   │   └── tracking/           # DonationTrackingTimeline
│   │
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── data/
│   │   ├── mockData.ts
│   │   └── matchingEngine.ts
│   │
│   ├── lib/
│   │   └── supabaseClient.ts    # Browser Supabase client (public keys only)
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── foodSafety.ts        # Countdown + allocation helpers
│   │   ├── geo.ts               # Haversine / km / travel estimate
│   │   └── tracking.ts          # Tracking state machine
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts                    # Express backend (source)
├── server.js                    # Bundled backend (generated by build:server)
├── package.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root. See `.env.example` for the full template.

### Server-side only (secrets — never exposed to the browser)

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
APP_URL=https://foodloop-nu.vercel.app/
```

### Browser-side (public / publishable — safe to ship in the client bundle)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_public_supabase_key
```

> ⚠️ **Never commit `.env`.** Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to browser-side code, and never give them a `VITE_` prefix. Only the public anon/publishable key belongs on a `VITE_` variable.

---

# 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/KalviinJoshua/Food-Loop.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using the template above. Never commit it.

### 4. Start the development environment

FoodLoop runs a Vite frontend and an Express backend together:

```bash
npm run dev:all
```

Expected local services:

* Frontend: http://localhost:3000
* Backend: http://localhost:3001

---

# 🧪 Development Verification

TypeScript validation:

```bash
npm run lint
```

This runs `tsc --noEmit`.

Production build (frontend):

```bash
npm run build
```

### Available scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Vite frontend on port 3000                      |
| `npm run dev:backend`  | Express backend (`tsx watch server.ts`) on 3001 |
| `npm run dev:all`      | Runs the frontend and backend together          |
| `npm run build`        | Vite production build → `dist/`                 |
| `npm run build:server` | Bundle `server.ts` → `server.js` (esbuild)      |
| `npm run preview`      | Preview the built frontend                      |
| `npm run lint`         | Typecheck with `tsc --noEmit`                   |
| `npm run clean`        | Remove `dist/` and `server.js`                  |

### Database connection test

```bash
curl http://localhost:3001/api/db-test
```

A successful response indicates FoodLoop is connected to Supabase:

```json
{
  "success": true,
  "message": "FoodLoop is connected to Supabase!",
  "rowsFound": 0
}
```

---

# 🧪 Example Demonstration

```text
1.  Open FoodLoop
2.  Register / Login as Donor
3.  Create a food donation
4.  Show the safety countdown
5.  Open Smart Matching
6.  Show the map and receiver distances
7.  Show the match-score breakdown
8.  Demonstrate partial allocation (auto-split)
9.  Show the pickup/delivery timeline
10. Show a notification
11. Demonstrate expiry behavior
12. Show the waste-management route
13. Switch to the Receiver dashboard
14. Demonstrate the Admin dashboard
```

This shows FoodLoop is more than a static website — it models a complete food-recovery workflow.

---

# 🔒 Security Considerations

The project follows a strict server/client security boundary.

**Backend-only secrets** — must remain on the server: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.

**Browser-safe configuration** — only the public Supabase URL and anon/publishable key are exposed to the browser.

**Before production deployment**, the system should also implement Supabase Row Level Security, strong authentication, server-side authorization, API rate limiting, input validation, audit logging, secure file-upload validation, role-based database policies, and server-side allocation/expiry validation.

---

# 📌 Current Prototype Limitations

FoodLoop is a functional prototype rather than a fully deployed logistics platform.

* Map travel time is an estimate rather than live traffic data.
* Pickup/delivery tracking is status-based rather than real-time GPS.
* Donations, allocations, tracking, and notifications are currently held in frontend/local storage and can be expanded into dedicated Supabase tables.
* Production-grade authentication and Row Level Security require further configuration.
* Real-world logistics integration is not connected.
* Physical waste processing is represented as a software workflow.
* The public deployment requires the backend/API deployment configuration to be fully connected before all backend-dependent features work publicly.

These are prototype boundaries and do not represent claims of real-world physical logistics integration.

---

# 🔮 Future Improvements

* 🗄️ Complete Supabase persistence for donations and allocations
* 🔔 Database-backed real-time notifications
* 📍 Real-time GPS pickup tracking
* 🗺️ Google Maps / routing API integration
* 🚚 Logistics optimization
* 📱 Progressive Web App / mobile application
* 🔐 Complete Supabase Auth + Row Level Security
* 📊 Advanced admin analytics and impact reporting
* 🧾 Complete donation history and digital receipts
* 🔔 Automated pickup reminders
* 🤖 More advanced AI recommendations
* 🌍 Multi-city / multi-region deployment
* 📩 Email / SMS / WhatsApp notifications
* ♻️ Advanced waste-processing analytics

---

# 🌱 Impact Vision

FoodLoop is designed around a simple principle:

> **Food that can feed people should reach people. Food that cannot should still be recovered responsibly.**

```text
                          FoodLoop
                             │
             ┌───────────────┼───────────────┐
             │               │               │
           DONORS         RECEIVERS       PROCESSORS
             │               │               │
             └───────────────┬───────────────┘
                             │
                      SMART MATCHING
                             │
                     PARTIAL ALLOCATION
                             │
                     PICKUP / DELIVERY
                             │
                       FOOD RECOVERY
                             │
                   ┌─────────┴─────────┐
                   │                   │
             Human Consumption    Waste Recovery
                                       │
                                 Compost / Biogas
```

The goal is to reduce food waste, improve food accessibility, and create a measurable circular recovery network.

---

# 👨‍💻 Author

**D. Kalviin Joshua**
B.Tech Computer Science & Engineering

GitHub: https://github.com/KalviinJoshua
Repository: https://github.com/KalviinJoshua/Food-Loop

---

# ⭐ Support

If you find FoodLoop useful or interesting, consider giving the repository a ⭐ on GitHub.
