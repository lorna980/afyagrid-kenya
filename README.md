🏥 AfyaGrid Kenya
Offline-Resilient County Clinic Triage & Essential Medicine Supply Intelligence Platform

1. Executive Summary & Problem Statement

Primary healthcare delivery across Kenyan Level 2 dispensaries, Level 3 health centres, and Level 4 sub-county hospitals faces two critical operational bottlenecks:

1. **Delayed & Uncoordinated Rural Patient Referrals:** Community Health Promoters (CHPs) operating in peri-urban and rural wards often assess patients without real-time visibility into which nearby sub-county hospital has open emergency beds or active clinical capacity, leading to preventable referral delays during maternal, pediatric, and severe febrile emergencies.
2. **Preventable Essential Medicine Stockouts & Batch Wastage:** While one dispensary may completely run out of essential Kenya Essential Medicines List (KEML) commodities—such as *Artemether-Lumefantrine (AL)* for malaria or *Oxytocin* for maternal care—a neighboring facility in the same county often holds surplus stock approaching its expiration date.

**AfyaGrid Kenya** solves both problems within a lightweight, zero-dependency, offline-resilient web platform designed specifically for low-bandwidth clinical environments.

---

## 2. Core System Capabilities & Role-Based Workflows

AfyaGrid Kenya operates across **three distinct operational roles**, accessible directly from the landing page via one-click demo switches:

### 🌐 Public County Health Network Overview (`index.html`)
* **Real-Time County KPIs:** Aggregates live facility counts, total available emergency beds, low-stock alerts, and logged triage cases directly from PostgreSQL.
* **Interactive Facility Network Matrix:** Displays active Kenyan clinics across Nairobi, Kisumu, Nakuru, and Uasin Gishu counties with GPS coordinates and operational status. Clicking any facility opens an **Inspector & Quick-Edit Modal** to view facility-level medicine inventory or update emergency bed capacity live in the database.
* **Essential Drug Stock Watch:** Automatically flags medications whose unit quantities have dropped to or below facility reorder thresholds.

### 🩺 Role 1: Community Health Promoter (`dashboard.html?role=chp`)
* **Deterministic Clinical Triage Scoring Engine:** Evaluates observed symptoms, red-flag danger signs (respiratory distress, convulsions, maternal danger signs, severe dehydration), and patient vulnerability weights (children under 5 and pregnant women).
* **Automated Urgency Classification:**
  * `RED (Score ≥ 6)`: Critical emergency requiring immediate ambulance/urgent referral to a Level 4 hospital.
  * `YELLOW (Score 3–5)`: Priority acute infection requiring same-day diagnostic clinical review.
  * `GREEN (Score < 3)`: Routine outpatient case suitable for local dispensary management.
* **Smart Receiving-Facility Matching & Digital Referral Slip:** Selects the open facility in the patient's county with the highest available emergency bed capacity, generates an anonymized patient tracking code (`AG-2026-XXX`) to protect patient privacy, and produces an instant digital referral slip.

### 💊 Role 2: Clinic Nurse / Pharmacist (`dashboard.html?role=nurse`)
* **KEMSA Drug Batch Intake:** Logs newly delivered pharmaceutical batches with batch numbers, unit quantities, and expiration dates directly into PostgreSQL.
* **Live Dispensing & Reorder Threshold Monitoring:** Enables one-click dispensing (`-10 Dispense`) that updates stock counts in real time and dynamically recalculates `LOW STOCK` vs. `ADEQUATE` status badges.

### 📊 Role 3: County Health Officer (`dashboard.html?role=county`)
* **Inter-Clinic Stock Redistribution Workflow:** Reviews pending stock transfer requests between surplus sub-county hospitals and deficit health centres, allowing one-click approval and dispatch logging to prevent stockouts and drug expiry wastage.

---

## 3. System Architecture & Engineering Design

```text
+-------------------------------------------------------------------------+

|                       AFYAGRID KENYA (CLIENT LAYER)                     |
|                                                                         |
|  [index.html + home.js]               [dashboard.html + dashboard.js]   |
|   • County KPI Aggregator              • Clinical Triage Scoring Engine |
|   • Facility Quick-Edit Modal          • Pharmacy Batch & Dispense UI   |
|   • Essential Drug Stock Watch         • County Transfer Approval Desk  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+

|                 RESILIENT DATA ACCESS LAYER (config.js)                 |
|                                                                         |
|   • Native Fetch REST Client with AbortController (6s Fast Timeout)     |
|   • Automatic Offline Fallback Cache (localStorage + Embedded Seed)     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+

|              CLOUD RELATIONAL DATABASE (SUPABASE POSTGRESQL)            |
|                                                                         |
|   [clinics] <---(FK)--- [medicine_stock]                                |
|      ^                                                                  |
|      +----------(FK)--- [triage_cases]                                  |
|      +----------(FK)--- [stock_transfers]                               |
+-------------------------------------------------------------------------+
```

### Key Architectural Decisions
* **Zero External CDN Runtime Dependencies:** Rural health facilities frequently experience high latency or blocked external script CDNs. AfyaGrid uses a custom-engineered standalone CSS3 design system (`assets/css/custom.css`) and Chrome's native `fetch()` API rather than heavy third-party bundles, guaranteeing sub-second page rendering even on 2G/3G mobile connections.
* **Offline-First Resilience (`localStorage` + `AbortController`):** Every REST query enforces a strict timeout using `AbortController`. If network connectivity drops mid-shift, CHPs can continue logging triage cases—assessments are queued locally in `localStorage` (`afyagrid_offline_cases`), tracked via a live offline badge counter, and persisted seamlessly when connectivity returns.
* **Privacy-by-Design Data Model:** Instead of storing personally identifiable patient names or national ID numbers, triage records generate anonymized case identifiers (`AG-2026-XXX`) paired with age brackets and clinical symptom vectors.

---

## 4. Relational Database Schema (`database/schema.sql`)

The backend is normalized into **four relational PostgreSQL tables** hosted on Supabase with foreign-key referential integrity:

| Table Name | Primary Purpose | Key Columns & Constraints |
| :--- | :--- | :--- |
| **`clinics`** | Stores Kenyan health facilities & capacity | `id (PK)`, `name`, `county`, `sub_county`, `facility_level`, `latitude`, `longitude`, `is_open`, `emergency_beds` |
| **`triage_cases`** | Stores anonymized symptom assessments | `id (PK)`, `patient_code`, `age_group`, `county`, `symptoms`, `urgency_level (GREEN/YELLOW/RED)`, `referred_clinic_id (FK)` |
| **`medicine_stock`** | Tracks essential KEMSA drug batches | `id (PK)`, `clinic_id (FK)`, `drug_name`, `category`, `batch_number`, `quantity_units`, `reorder_level`, `expiry_date` |
| **`stock_transfers`** | Tracks inter-clinic stock redistribution | `id (PK)`, `from_clinic_id (FK)`, `to_clinic_id (FK)`, `drug_name`, `quantity_requested`, `status (PENDING/APPROVED/DELIVERED)` |

---

## 5. Repository Structure

```text
afyagrid-kenya/
├── index.html                  # Public County Network Overview, KPIs & Clinic Quick-Edit Modal
├── dashboard.html              # Role-Based Operational Workspace (CHP, Nurse, County Officer)
├── assets/
│   ├── css/
│   │   └── custom.css          # Standalone responsive design system (zero external CDN dependency)
│   └── js/
│       ├── config.js           # Supabase PostgreSQL REST client, timeout controller & offline cache
│       ├── home.js             # Landing page KPI aggregation, stock watch & clinic modal logic
│       └── dashboard.js        # Clinical triage scoring engine, inventory dispensing & transfer logic
├── database/
│   ├── schema.sql              # PostgreSQL DDL table definitions, constraints & RLS policies
│   └── seed_data.sql           # Realistic Kenyan county clinic & KEMSA pharmaceutical seed dataset
└── README.md                   # Complete architectural & technical documentation
```

---

## 6. Local Setup & Deployment Guide

1. **Clone the Repository:**
   ```bash
   git clone https://github.com
   cd afyagrid-kenya
   ```
2. **Initialize Supabase PostgreSQL:**
   * Create a free project on [Supabase](https://supabase.com).
   * Open the **SQL Editor** and execute `database/schema.sql` followed by `database/seed_data.sql`.
3. **Configure API Credentials:**
   * Open `assets/js/config.js` and set `SUPABASE_URL` and `SUPABASE_KEY` (using your project's public `sb_publishable_...` key).
4. **Run Locally or Deploy:**
5.