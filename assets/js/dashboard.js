// AfyaGrid Kenya - Operational Workspace Controller
let localClinics = [];
let localStock = [];
let localCases = [];
let localTransfers = [
    { id: 101, from: 'Mama Lucy Kibaki Hospital', to: 'Embakasi Health Centre', drug: 'Artemether-Lumefantrine (AL 20/120mg)', qty: 150, status: 'PENDING' },
    { id: 102, from: 'Turbo Sub-County Hospital', to: 'Kombewa Sub-County Hospital', drug: 'Oral Rehydration Salts (ORS)', qty: 100, status: 'APPROVED' }
];

function switchRole(role) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.role === role));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${role}`));
}

async function runTriageAssessment() {
    const age = document.getElementById('t-age').value;
    const county = document.getElementById('t-county').value;
    const notes = document.getElementById('t-notes').value;
    const checked = Array.from(document.querySelectorAll('#panel-chp input[type="checkbox"]:checked'));

    if (checked.length === 0) {
        alert('Please select at least one observed symptom.');
        return;
    }

    let score = checked.reduce((sum, box) => sum + parseInt(box.dataset.score), 0);
    if (age === 'Child (Under 5)' || age === 'Pregnant Woman') score += 2;

    let urgency = 'GREEN';
    let condition = 'Routine Outpatient / Mild Viral Illness';
    let action = 'Manage at local dispensary with oral hydration & follow-up in 48 hours.';

    if (score >= 6) {
        urgency = 'RED';
        condition = 'Critical Emergency / Severe Febrile or Maternal Danger';
        action = 'IMMEDIATE AMBULANCE / URGENT REFERRAL to nearest Level 4 Hospital with emergency beds.';
    } else if (score >= 3) {
        urgency = 'YELLOW';
        condition = 'Priority Acute Infection (Requires Same-Day Clinical Review)';
        action = 'Refer to Level 3/4 facility within 4 hours for diagnostic lab testing.';
    }

    if (localClinics.length === 0) localClinics = await fetchClinics();
    const countyClinics = localClinics.filter(c => c.county === county && c.is_open);
    const pool = countyClinics.length > 0 ? countyClinics : localClinics;
    const sortedPool = [...pool].sort((a, b) => b.emergency_beds - a.emergency_beds);
    const targetClinic = sortedPool.at(0);

    const patientCode = `AG-2026-${Math.floor(100 + Math.random() * 900)}`;
    const symptomText = checked.map(c => c.value).join(', ') + (notes ? ` (${notes})` : '');

    const newCase = {
        patient_code: patientCode,
        age_group: age,
        county: county,
        symptoms: symptomText,
        urgency_level: urgency,
        suspected_condition: condition,
        referred_clinic_id: targetClinic.id,
        clinics: { name: targetClinic.name }
    };

    localCases.unshift(newCase);
    const offlineQueue = JSON.parse(localStorage.getItem('afyagrid_offline_cases') || '[]');
    offlineQueue.push(newCase);
    localStorage.setItem('afyagrid_offline_cases', JSON.stringify(offlineQueue));
    updateQueueBadge();

    document.getElementById('referral-output').innerHTML = `
        <div class="referral-box ${urgency}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <strong style="font-size:1rem;">Official Digital Referral Slip • ${patientCode}</strong>
                <span class="pill-urg urg-${urgency}">${urgency} PRIORITY</span>
            </div>
            <p style="font-size:0.85rem;"><strong>Assessment:</strong> ${condition}</p>
            <p style="font-size:0.85rem; margin-top:0.25rem;"><strong>Recommended Action:</strong> ${action}</p>
            <p style="font-size:0.85rem; margin-top:0.25rem;"><strong>Assigned Receiving Facility:</strong> ${targetClinic.name} (${targetClinic.county} • ${targetClinic.emergency_beds} beds available)</p>
        </div>
    `;

    renderTriageHistory();
    checked.forEach(box => box.checked = false);
    document.getElementById('t-notes').value = '';

    await supabaseQuery('triage_cases', {
        method: 'POST',
        body: JSON.stringify({
            patient_code: newCase.patient_code,
            age_group: newCase.age_group,
            county: newCase.county,
            symptoms: newCase.symptoms,
            urgency_level: newCase.urgency_level,
            suspected_condition: newCase.suspected_condition,
            referred_clinic_id: newCase.referred_clinic_id
        })
    });
}

async function addDrugBatch() {
    const drugName = document.getElementById('s-drug').value.trim();
    if (!drugName) {
        alert('Please enter an essential medicine name.');
        return;
    }
    const clinicId = parseInt(document.getElementById('s-clinic').value);
    const clinicObj = localClinics.find(c => c.id === clinicId) || localClinics.at(0);
    const qty = parseInt(document.getElementById('s-qty').value) || 100;
    const exp = document.getElementById('s-exp').value;
    const batch = `KEMSA-${Math.floor(100 + Math.random() * 899)}`;

    localStock.unshift({
        id: Date.now(),
        clinic_id: clinicId,
        drug_name: drugName,
        batch_number: batch,
        quantity_units: qty,
        reorder_level: 50,
        expiry_date: exp,
        clinics: { name: clinicObj.name, county: clinicObj.county }
    });

    renderInventoryTable();
    document.getElementById('s-drug').value = '';

    await supabaseQuery('medicine_stock', {
        method: 'POST',
        body: JSON.stringify({
            clinic_id: clinicId,
            drug_name: drugName,
            category: 'Essential Medicine',
            batch_number: batch,
            quantity_units: qty,
            reorder_level: 50,
            expiry_date: exp
        })
    });
}

async function dispenseUnits(id) {
    const item = localStock.find(s => s.id === id);
    if (item && item.quantity_units >= 10) {
        item.quantity_units -= 10;
        renderInventoryTable();
        await supabaseQuery(`medicine_stock?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity_units: item.quantity_units })
        });
    }
}

function approveTransfer(id) {
    const tr = localTransfers.find(t => t.id === id);
    if (tr) {
        tr.status = 'APPROVED';
        renderTransfersTable();
    }
}

function renderTriageHistory() {
    document.getElementById('triage-history-list').innerHTML = localCases.map(c => `
        <div class="stock-item">
            <div class="stock-top">
                <strong>${c.patient_code} • ${c.age_group}</strong>
                <span class="pill-urg urg-${c.urgency_level}">${c.urgency_level}</span>
            </div>
            <p style="font-size:0.8rem; color:#334155; margin-top:0.25rem;">${c.suspected_condition}</p>
            <p class="stock-clinic">🏥 Referred to: <strong>${c.clinics?.name || 'County Facility'}</strong> (${c.county})</p>
        </div>
    `).join('');
}

function renderInventoryTable() {
    document.getElementById('inventory-table-body').innerHTML = localStock.map(item => {
        const isLow = item.quantity_units <= item.reorder_level;
        return `
            <tr>
                <td><strong>${item.drug_name}</strong></td>
                <td>${item.clinics?.name || 'Clinic'}</td>
                <td>${item.batch_number}</td>
                <td><strong>${item.quantity_units}</strong> units</td>
                <td>${item.expiry_date}</td>
                <td>${isLow ? '<span class="badge-low">LOW STOCK</span>' : '<span class="badge-ok">ADEQUATE</span>'}</td>
                <td><button type="button" class="btn-sm btn-dispense" onclick="dispenseUnits(${item.id})">-10 Dispense</button></td>
            </tr>
        `;
    }).join('');
}

function renderTransfersTable() {
    document.getElementById('transfers-table-body').innerHTML = localTransfers.map(t => `
        <tr>
            <td>#TR-${t.id}</td>
            <td>${t.from}</td>
            <td>${t.to}</td>
            <td><strong>${t.drug}</strong></td>
            <td>${t.qty} units</td>
            <td><span class="pill-urg ${t.status === 'APPROVED' ? 'urg-GREEN' : 'urg-YELLOW'}">${t.status}</span></td>
            <td>
                ${t.status === 'PENDING'
                    ? `<button type="button" class="btn-sm btn-approve" onclick="approveTransfer(${t.id})">✓ Approve & Dispatch</button>`
                    : `<span style="font-size:0.75rem; color:#059669; font-weight:700;">Dispatched</span>`}
            </td>
        </tr>
    `).join('');
}

function updateQueueBadge() {
    const q = JSON.parse(localStorage.getItem('afyagrid_offline_cases') || '[]');
    document.getElementById('offline-queue-badge').textContent = `${q.length} Offline Cached Cases`;
}

async function initDashboard() {
    const params = new URLSearchParams(window.location.search);
    const initialRole = params.get('role');
    if (initialRole) switchRole(initialRole);

    localClinics = await fetchClinics();
    localStock = await fetchMedicineStock();
    localCases = await fetchTriageCases();

    renderTriageHistory();
    renderInventoryTable();
    renderTransfersTable();
    updateQueueBadge();
}

window.addEventListener('DOMContentLoaded', initDashboard);