// AfyaGrid Kenya - Home Page Controller
let allClinics = [];
let allStock = [];
let activeClinicId = null;

async function initHomePage() {
    const badge = document.getElementById('connection-badge');
    allClinics = await fetchClinics();
    allStock = await fetchMedicineStock();
    const cases = await fetchTriageCases();

    if (liveConnected) {
        badge.textContent = '🟢 Live PostgreSQL Connected';
        badge.style.backgroundColor = '#065f46';
        badge.style.color = '#a7f3d0';
    } else {
        badge.textContent = '🟡 Offline Resilience Cache';
        badge.style.backgroundColor = '#92400e';
        badge.style.color = '#fef3c7';
    }

    document.getElementById('stat-cases').textContent = cases.length;
    renderClinicsAndStats();
    renderStockAlerts();
}

function renderClinicsAndStats() {
    document.getElementById('stat-clinics').textContent = allClinics.length;
    const totalBeds = allClinics.reduce((sum, c) => sum + (parseInt(c.emergency_beds) || 0), 0);
    document.getElementById('stat-beds').textContent = totalBeds;

    const mapContainer = document.getElementById('kenya-map');
    mapContainer.style.height = 'auto';
    mapContainer.style.padding = '1rem';
    mapContainer.style.background = '#f1f5f9';
    mapContainer.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">` +
        allClinics.map(c => `
            <div class="clinic-card" onclick="openClinicModal(${c.id})">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <strong style="color: #0f766e; font-size: 0.9rem;">${c.name}</strong>
                    <span style="font-size: 0.65rem; background: ${c.is_open ? '#d1fae5' : '#ffe4e6'}; color: ${c.is_open ? '#065f46' : '#be123c'}; padding: 0.1rem 0.45rem; border-radius: 999px; font-weight: 700;">
                        ${c.is_open ? 'OPEN' : 'FULL'}
                    </span>
                </div>
                <p style="font-size: 0.75rem; color: #475569; margin-top: 0.2rem;">${c.facility_level} • <strong>${c.county}</strong> (${c.sub_county})</p>
                <p style="font-size: 0.75rem; color: #334155; margin-top: 0.5rem;">🛏️ Emergency Beds: <strong>${c.emergency_beds}</strong></p>
                <p style="font-size: 0.7rem; color: #0f766e; font-weight: 600; margin-top: 0.35rem;">✏️ Click to inspect or edit capacity</p>
            </div>
        `).join('') + `</div>`;
}

function renderStockAlerts() {
    const lowStockItems = allStock.filter(item => item.quantity_units <= item.reorder_level);
    document.getElementById('stat-low-stock').textContent = lowStockItems.length;

    const stockList = document.getElementById('stock-alert-list');
    stockList.innerHTML = allStock.map(item => {
        const isLow = item.quantity_units <= item.reorder_level;
        return `
            <div class="${isLow ? 'stock-item low' : 'stock-item'}">
                <div class="stock-top">
                    <p class="stock-name">${item.drug_name}</p>
                    ${isLow ? '<span class="badge-low">LOW STOCK</span>' : '<span class="badge-ok">ADEQUATE</span>'}
                </div>
                <p class="stock-clinic">📍 ${item.clinics?.name || 'Clinic'} (${item.clinics?.county || ''})</p>
                <div class="stock-meta">
                    <span>Qty: <strong class="${isLow ? 'text-red' : ''}">${item.quantity_units} units</strong> (Min: ${item.reorder_level})</span>
                    <span>Exp: ${item.expiry_date}</span>
                </div>
            </div>
        `;
    }).join('');
}

function openClinicModal(id) {
    const clinic = allClinics.find(c => c.id === id);
    if (!clinic) return;
    activeClinicId = id;
    document.getElementById('m-title').textContent = clinic.name;
    document.getElementById('m-subtitle').textContent = `${clinic.facility_level} • ${clinic.county} (${clinic.sub_county})`;
    document.getElementById('m-beds').value = clinic.emergency_beds;
    document.getElementById('m-status').value = String(clinic.is_open);

    const facilityDrugs = allStock.filter(s => s.clinic_id === id);
    document.getElementById('m-drugs').innerHTML = facilityDrugs.length > 0
        ? facilityDrugs.map(d => `<div style="margin-bottom:0.25rem;">• <strong>${d.drug_name}</strong>: ${d.quantity_units} units</div>`).join('')
        : 'No medicine batches logged yet.';

    document.getElementById('clinic-modal').classList.add('open');
}

function closeClinicModal() {
    document.getElementById('clinic-modal').classList.remove('open');
}

async function saveClinicChanges() {
    const clinic = allClinics.find(c => c.id === activeClinicId);
    if (!clinic) return;
    const newBeds = parseInt(document.getElementById('m-beds').value) || 0;
    const newOpen = document.getElementById('m-status').value === 'true';

    clinic.emergency_beds = newBeds;
    clinic.is_open = newOpen;

    await supabaseQuery(`clinics?id=eq.${activeClinicId}`, {
        method: 'PATCH',
        body: JSON.stringify({ emergency_beds: newBeds, is_open: newOpen })
    });

    renderClinicsAndStats();
    closeClinicModal();
}

window.addEventListener('DOMContentLoaded', initHomePage);