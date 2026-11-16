-- INSERT REALISTIC KENYAN CLINICS
INSERT INTO clinics (name, county, sub_county, facility_level, latitude, longitude, is_open, emergency_beds) VALUES
('Embakasi Health Centre', 'Nairobi', 'Embakasi East', 'Level 3 Health Centre', -1.323500, 36.900100, TRUE, 8),
('Mama Lucy Kibaki Hospital', 'Nairobi', 'Embakasi West', 'Level 4 Sub-County Hospital', -1.273800, 36.890200, TRUE, 15),
('Kombewa Sub-County Hospital', 'Kisumu', 'Seme', 'Level 4 Sub-County Hospital', -0.106200, 34.518600, TRUE, 10),
('Lanet Health Centre', 'Nakuru', 'Nakuru Town East', 'Level 3 Health Centre', -0.303100, 36.143600, TRUE, 6),
('Turbo Sub-County Hospital', 'Uasin Gishu', 'Turbo', 'Level 4 Sub-County Hospital', 0.648100, 35.048900, TRUE, 12);

-- INSERT ESSENTIAL MEDICINES (With Low Stock & Near-Expiry Examples)
INSERT INTO medicine_stock (clinic_id, drug_name, category, batch_number, quantity_units, reorder_level, expiry_date) VALUES
(1, 'Artemether-Lumefantrine (AL 20/120mg)', 'Antimalarial', 'KEMSA-AL-901', 18, 50, '2027-04-15'),
(1, 'Amoxicillin 500mg Capsules', 'Antibiotic', 'KEMSA-AM-402', 240, 80, '2027-08-20'),
(1, 'Oral Rehydration Salts (ORS)', 'Pediatric / GI', 'KEMSA-OR-112', 310, 100, '2027-11-01'),
(2, 'Artemether-Lumefantrine (AL 20/120mg)', 'Antimalarial', 'KEMSA-AL-884', 420, 100, '2026-12-28'),
(2, 'Paracetamol 500mg Tablets', 'Analgesic', 'KEMSA-PA-305', 600, 150, '2027-09-10'),
(3, 'Artemether-Lumefantrine (AL 20/120mg)', 'Antimalarial', 'KEMSA-AL-770', 25, 120, '2027-05-12'),
(3, 'Oxytocin 10 IU Injection', 'Maternal Health', 'KEMSA-OX-209', 14, 30, '2027-02-18'),
(4, 'Amoxicillin 500mg Capsules', 'Antibiotic', 'KEMSA-AM-511', 35, 75, '2027-06-30'),
(5, 'Oral Rehydration Salts (ORS)', 'Pediatric / GI', 'KEMSA-OR-198', 450, 100, '2027-10-15');

-- INSERT SAMPLE TRIAGE CASES
INSERT INTO triage_cases (patient_code, age_group, county, symptoms, urgency_level, suspected_condition, referred_clinic_id) VALUES
('AG-2026-001', 'Child (Under 5)', 'Nairobi', 'High fever, chills, vomiting, lethargy', 'RED', 'Severe Malaria / Febrile Illness', 2),
('AG-2026-002', 'Adult (18-59)', 'Nairobi', 'Mild cough, sore throat, no fever', 'GREEN', 'Upper Respiratory Tract Infection', 1),
('AG-2026-003', 'Pregnant Woman', 'Kisumu', 'Severe headache, blurred vision, swelling', 'RED', 'Suspected Pre-eclampsia (Maternal Emergency)', 3),
('AG-2026-004', 'Adult (18-59)', 'Nakuru', 'Persistent cough for 5 days, moderate fever', 'YELLOW', 'Lower Respiratory Infection', 4);

-- INSERT SAMPLE STOCK TRANSFER REQUEST
INSERT INTO stock_transfers (from_clinic_id, to_clinic_id, drug_name, quantity_requested, status) VALUES
(2, 1, 'Artemether-Lumefantrine (AL 20/120mg)', 150, 'PENDING');