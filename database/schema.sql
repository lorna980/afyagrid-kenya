-- 1. CLINICS TABLE: Stores Kenyan health facilities
CREATE TABLE clinics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100) NOT NULL,
    facility_level VARCHAR(50) NOT NULL, -- e.g., Level 2 Dispensary, Level 3 Health Centre
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    emergency_beds INTEGER DEFAULT 5
);

-- 2. TRIAGE CASES TABLE: Stores anonymized patient assessments
CREATE TABLE triage_cases (
    id SERIAL PRIMARY KEY,
    patient_code VARCHAR(30) NOT NULL,
    age_group VARCHAR(30) NOT NULL,
    county VARCHAR(100) NOT NULL,
    symptoms TEXT NOT NULL,
    urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('GREEN', 'YELLOW', 'RED')),
    suspected_condition VARCHAR(100) NOT NULL,
    referred_clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MEDICINE STOCK TABLE: Tracks essential drugs & expiry dates
CREATE TABLE medicine_stock (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    drug_name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity_units INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 50,
    expiry_date DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STOCK TRANSFERS TABLE: Tracks inter-clinic medicine redistribution
CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    from_clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    to_clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    drug_name VARCHAR(150) NOT NULL,
    quantity_requested INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DELIVERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE PUBLIC READ/WRITE ACCESS FOR DEMO PROTOTYPE (Row Level Security)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access clinics" ON clinics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access triage" ON triage_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access stock" ON medicine_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access transfers" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);