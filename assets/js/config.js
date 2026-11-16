// AfyaGrid Kenya - Direct PostgreSQL REST Client (Zero External CDN Needed!)
const SUPABASE_URL = 'https://ohyiremaigoceguoitab.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FnH3MJ1XsLvda9dznalMzQ_n6H-SFss';

const isConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.length > 20;
let liveConnected = false;

// Built-in Offline Fallback Data (Renders instantly if network is slow/offline)
const FALLBACK_CLINICS = [
    { id: 1, name: 'Embakasi Health Centre', county: 'Nairobi', sub_county: 'Embakasi East', facility_level: 'Level 3 Health Centre', latitude: -1.3235, longitude: 36.9001, is_open: true, emergency_beds: 8 },
    { id: 2, name: 'Mama Lucy Kibaki Hospital', county: 'Nairobi', sub_county: 'Embakasi West', facility_level: 'Level 4 Sub-County Hospital', latitude: -1.2738, longitude: 36.8902, is_open: true, emergency_beds: 15 },
    { id: 3, name: 'Kombewa Sub-County Hospital', county: 'Kisumu', sub_county: 'Seme', facility_level: 'Level 4 Sub-County Hospital', latitude: -0.1062, longitude: 34.5186, is_open: true, emergency_beds: 10 },
    { id: 4, name: 'Lanet Health Centre', county: 'Nakuru', sub_county: 'Nakuru Town East', facility_level: 'Level 3 Health Centre', latitude: -0.3031, longitude: 36.1436, is_open: true, emergency_beds: 6 },
    { id: 5, name: 'Turbo Sub-County Hospital', county: 'Uasin Gishu', sub_county: 'Turbo', facility_level: 'Level 4 Sub-County Hospital', latitude: 0.6481, longitude: 35.0489, is_open: true, emergency_beds: 12 }
];

const FALLBACK_STOCK = [
    { id: 1, clinic_id: 1, drug_name: 'Artemether-Lumefantrine (AL 20/120mg)', category: 'Antimalarial', batch_number: 'KEMSA-AL-901', quantity_units: 18, reorder_level: 50, expiry_date: '2027-04-15', clinics: { name: 'Embakasi Health Centre', county: 'Nairobi' } },
    { id: 2, clinic_id: 3, drug_name: 'Oxytocin 10 IU Injection', category: 'Maternal Health', batch_number: 'KEMSA-OX-209', quantity_units: 14, reorder_level: 30, expiry_date: '2027-02-18', clinics: { name: 'Kombewa Sub-County Hospital', county: 'Kisumu' } },
    { id: 3, clinic_id: 3, drug_name: 'Artemether-Lumefantrine (AL 20/120mg)', category: 'Antimalarial', batch_number: 'KEMSA-AL-770', quantity_units: 25, reorder_level: 120, expiry_date: '2027-05-12', clinics: { name: 'Kombewa Sub-County Hospital', county: 'Kisumu' } },
    { id: 4, clinic_id: 4, drug_name: 'Amoxicillin 500mg Capsules', category: 'Antibiotic', batch_number: 'KEMSA-AM-511', quantity_units: 35, reorder_level: 75, expiry_date: '2027-06-30', clinics: { name: 'Lanet Health Centre', county: 'Nakuru' } },
    { id: 5, clinic_id: 1, drug_name: 'Amoxicillin 500mg Capsules', category: 'Antibiotic', batch_number: 'KEMSA-AM-402', quantity_units: 240, reorder_level: 80, expiry_date: '2027-08-20', clinics: { name: 'Embakasi Health Centre', county: 'Nairobi' } },
    { id: 6, clinic_id: 2, drug_name: 'Artemether-Lumefantrine (AL 20/120mg)', category: 'Antimalarial', batch_number: 'KEMSA-AL-884', quantity_units: 420, reorder_level: 100, expiry_date: '2026-12-28', clinics: { name: 'Mama Lucy Kibaki Hospital', county: 'Nairobi' } }
];

const FALLBACK_CASES = [
    { id: 1, patient_code: 'AG-2026-001', age_group: 'Child (Under 5)', county: 'Nairobi', symptoms: 'High fever, chills, vomiting, lethargy', urgency_level: 'RED', suspected_condition: 'Severe Malaria / Febrile Illness', referred_clinic_id: 2, clinics: { name: 'Mama Lucy Kibaki Hospital' } },
    { id: 2, patient_code: 'AG-2026-002', age_group: 'Adult (18-59)', county: 'Nairobi', symptoms: 'Mild cough, sore throat, no fever', urgency_level: 'GREEN', suspected_condition: 'Upper Respiratory Tract Infection', referred_clinic_id: 1, clinics: { name: 'Embakasi Health Centre' } },
    { id: 3, patient_code: 'AG-2026-003', age_group: 'Pregnant Woman', county: 'Kisumu', symptoms: 'Severe headache, blurred vision, swelling', urgency_level: 'RED', suspected_condition: 'Suspected Pre-eclampsia', referred_clinic_id: 3, clinics: { name: 'Kombewa Sub-County Hospital' } },
    { id: 4, patient_code: 'AG-2026-004', age_group: 'Adult (18-59)', county: 'Nakuru', symptoms: 'Persistent cough for 5 days, moderate fever', urgency_level: 'YELLOW', suspected_condition: 'Lower Respiratory Infection', referred_clinic_id: 4, clinics: { name: 'Lanet Health Centre' } }
];

// Native REST helper with 4-second fast timeout so the UI never freezes
async function supabaseQuery(endpoint, options = {}) {
    if (!isConfigured) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        liveConnected = true;
        return await res.json();
    } catch (err) {
        clearTimeout(timer);
        return null;
    }
}

async function fetchClinics() {
    const data = await supabaseQuery('clinics?select=*&order=id.asc');
    return data && data.length > 0 ? data : FALLBACK_CLINICS;
}

async function fetchMedicineStock() {
    const data = await supabaseQuery('medicine_stock?select=*,clinics(name,county)&order=quantity_units.asc');
    return data && data.length > 0 ? data : FALLBACK_STOCK;
}

async function fetchTriageCases() {
    const data = await supabaseQuery('triage_cases?select=*,clinics(name)&order=created_at.desc');
    return data && data.length > 0 ? data : FALLBACK_CASES;
}