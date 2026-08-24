# 🍽️ FoodLoop — Intelligent Food Recovery Platform

> **Recovering Food. Restoring Hope.**

FoodLoop is an intelligent food recovery and waste management platform that connects **food donors, receivers, and waste processors** through smart matching and automated allocation.

The platform helps restaurants, hotels, supermarkets, NGOs, shelters, orphanages, compost facilities, and biogas plants coordinate food recovery and organic waste diversion through one unified system.

---

## 🌐 Live Demo

**Website:**https://foodloop-nu.vercel.app/

---

## 🎯 What is FoodLoop?

Every day, large quantities of edible food are wasted while organizations and communities struggle to access sufficient food.

FoodLoop addresses this gap by creating a digital recovery network:

```text
Food Donor
    │
    ▼
Create Donation
    │
    ▼
Smart Matching Engine
    │
    ├───────────────┐
    ▼               ▼
Receiver A       Receiver B
    │               │
    └───────┬───────┘
            ▼
      Auto-Split Allocation
            │
            ▼
        Acceptance
            │
            ▼
         Collection
            │
            ▼
        Completion
            │
            ▼
       Rating & Reliability
```

For organic waste:

```text
Food Donor
    │
    ▼
Organic Waste
    │
    ▼
Smart Matching
    │
    ▼
Waste Processor
    │
    ▼
Pickup
    │
    ▼
Waste Diversion
```

---

# ✨ Key Features

## 🍱 Food Donation Management

Donors can create food donation posts containing:

* Food quantity
* Description
* Preparation information
* Safe-until time
* Allergens
* Delivery radius
* Pickup information

Donations are tracked throughout their lifecycle.

```text
Posted
  ↓
Matched
  ↓
Accepted
  ↓
Collected
  ↓
Completed
```

---

## 🤖 AI-Powered Smart Matching

FoodLoop uses a hybrid matching architecture.

### Deterministic Matching

Candidates are ranked using five factors:

| Factor                  |   Weight |
| ----------------------- | -------: |
| Distance                |      40% |
| Quantity Compatibility  |      25% |
| Transport Compatibility |      15% |
| Food Compatibility      |      10% |
| Reliability             |      10% |
| **Total**               | **100%** |

The system uses geographic distance, receiver demand, transport capabilities, food requirements, and partner reliability to determine suitable matches.

### Google Gemini

Google Gemini enhances the matching process by providing:

* Match reasoning
* Partner recommendations
* AI-assisted analysis

If Gemini is unavailable, FoodLoop falls back to the deterministic matching engine.

---

# 🔀 Partial Allocation — Auto-Split

FoodLoop can distribute a single donation across multiple receivers.

For example:

```text
Donation: 300 meals

Receiver A → needs 80
Receiver B → needs 120
Receiver C → needs 150
```

FoodLoop automatically calculates:

```text
Receiver A → 80
Receiver B → 120
Receiver C → 100

Total Allocated → 300
Remaining → 0
```

The system ensures:

* A receiver never receives more than required.
* Total allocations never exceed the donation.
* Higher-ranked matches are processed first.
* Remaining demand is considered.
* Duplicate allocation is prevented.

---

# 🏢 Three Platform Roles

## 🟢 Donors

Restaurants, hotels, supermarkets, and other food providers can:

* Create food donations
* Create organic waste posts
* View smart matches
* Auto-allocate meals
* Track donation lifecycle
* View receiver requests
* Rate partners
* Monitor recovery impact

---

## 🔵 Receivers

NGOs, shelters, orphanages, and community organizations can:

* Discover available food
* Create food requests
* Specify meal requirements
* Specify dietary requirements
* Accept complete donations
* Accept partial allocations
* Track collections
* Complete rescues
* Rate donors

---

## 🟤 Waste Processors

Compost facilities, biogas plants, and other waste processors can:

* Discover organic waste
* View suitable waste opportunities
* Match based on capacity and suitability
* Schedule collection
* Track completed collections

---

# 📄 FSSAI Document Verification

FoodLoop includes functional FSSAI certificate processing for donor registration.

The registration workflow can process uploaded certificates and attempt to extract relevant information such as:

* FSSAI number
* Organization name
* Address
* License information
* Validity/expiry information

The extracted information can then be compared against the registration details.

Possible verification states include:

```text
Verified
Pending Review
Invalid
Expired
Document Unreadable
```

Uploaded documents are validated before processing.

---

# ⭐ Rating & Reliability System

After a completed donation, participants can rate their partners.

The system tracks:

### Rating

1–5 stars

### Reliability

50–100%

Reliability and ratings are recalculated from historical reviews.

These values are also used by the Smart Matching Engine.

This creates a feedback loop:

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

# 🗺️ Interactive Network Map

FoodLoop includes an interactive network visualization representing the recovery ecosystem.

It distinguishes:

🟢 Donors

🔵 Receivers

🟤 Waste Processors

The map supports:

* Role filtering
* Organization search
* User information
* Verification status
* Reliability information
* Dashboard navigation

---

# 🤖 FoodLoop AI Advisor

FoodLoop includes an AI-powered advisor using Google Gemini.

The advisor can help users understand:

* Food recovery decisions
* Donation optimization
* Matching considerations
* Waste diversion
* Platform workflows

Conversation history is persisted locally.

The system includes fallback handling when the AI service is unavailable.

---

# 🔐 Data & Authentication

FoodLoop currently uses role-based application authentication with:

* Donor
* Receiver
* Waste Processor

User profiles and application state are persisted locally using browser storage.

The architecture is designed so a cloud database and production authentication can be introduced later.

---

# 🏗️ Architecture

```text
                         FoodLoop
                            │
                ┌───────────┴───────────┐
                │                       │
             Frontend                Backend
                │                       │
        React + TypeScript           Express.js
                │                       │
          React Context                 │
                │                       │
          localStorage                  │
                │                       │
                └───────────┬───────────┘
                            │
                     Google Gemini
                            │
                  AI Matching / Advisor
```

---

# 🛠️ Tech Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion / Motion
* Google Material Symbols

## Backend

* Node.js
* Express.js
* TypeScript

## AI

* Google Gemini 2.5 Flash

## State Management

* React Context API
* localStorage persistence

## Document Processing

* PDF document processing
* Certificate validation
* OCR/document processing where supported

---

# 📂 Project Structure

```text
FoodLoop/
│
├── src/
│   ├── components/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── map/
│   │   ├── navbar/
│   │   └── ratings/
│   │
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── data/
│   │   └── mockData.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── server.js
├── package.json
├── vite.config.ts
└── README.md
```

---

# 🔄 Core Data Flow

## Food Recovery

```text
Register
   ↓
FSSAI Verification
   ↓
Login
   ↓
Create Donation
   ↓
Calculate Matches
   ↓
Gemini Analysis
   ↓
Top 3 Partners
   ↓
Auto-Split
   ↓
Receiver Acceptance
   ↓
Collection
   ↓
Completion
   ↓
Rating
   ↓
Reliability Update
```

---

# ♻️ Organic Waste Recovery

FoodLoop also handles food that is no longer suitable for human consumption.

```text
Organic Waste
      ↓
Waste Processor Matching
      ↓
Capacity Verification
      ↓
Processor Selection
      ↓
Pickup
      ↓
Completion
      ↓
Waste Diverted
```

This enables food that cannot be safely redistributed to still enter a sustainable recovery pathway.

---

# 📊 Smart Matching Example

Suppose a restaurant has:

```text
300 meals
```

Available receivers:

```text
NGO A
Distance: 2 km
Need: 80
Reliability: 96%

NGO B
Distance: 5 km
Need: 120
Reliability: 91%

NGO C
Distance: 8 km
Need: 150
Reliability: 87%
```

FoodLoop calculates a multi-factor score for each receiver and ranks them.

The Auto-Split engine then distributes:

```text
NGO A → 80 meals
NGO B → 120 meals
NGO C → 100 meals
```

No food is allocated beyond the receiver's requirement.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/KalviinJoshua/Food-Loop.git
cd Food-Loop
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file in the project root.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Never commit the `.env` file to Git.

---

## 4. Start the development server

Use the development command defined in `package.json`.

Typically:

```bash
npm run dev
```

The frontend and backend should start according to the project's Vite/Express configuration.

---

# 🧪 Build & Verification

TypeScript validation:

```bash
npx tsc --noEmit
```

Production build:

```bash
npm run build
```

The project should complete both checks without errors.

---

# 🔮 Future Improvements

FoodLoop can be extended with:

* 🔔 Real-time notifications
* 📱 Native mobile application
* 🛰️ Live GPS pickup tracking
* 🗺️ Google Maps integration
* ☁️ Cloud database
* 🔐 OAuth / production authentication
* 📊 Admin analytics dashboard
* 📈 Impact reporting
* 📦 Digital donation history
* 🚚 Logistics optimization
* 🔔 Automated pickup reminders
* 🌍 Multi-city / multi-region deployment

---

# 🌱 Impact Vision

FoodLoop is designed around a simple principle:

> **Food that can feed people should reach people. Food that cannot should still be recovered responsibly.**

The platform connects the entire recovery chain:

```text
                FOODLOOP
                   │
       ┌───────────┼───────────┐
       │           │           │
     DONORS     RECEIVERS   PROCESSORS
       │           │           │
       └─────── SMART MATCH ───┘
                   │
             LESS FOOD WASTE
                   │
             MORE FOOD RECOVERY
                   │
             MORE SUSTAINABILITY
```

---

# 👨‍💻 Author

**D. Kalviin Joshua**

B.Tech Computer Science & Engineering

GitHub:
https://github.com/KalviinJoshua

Repository:
https://github.com/KalviinJoshua/Food-Loop

---

# ⭐ Support

If you find FoodLoop useful or interesting, consider giving the repository a ⭐ on GitHub.

---

⭐ If you found this project helpful, consider starring the repository.
=======
