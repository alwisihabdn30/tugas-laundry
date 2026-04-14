/* =============================================
   LAUNDRY KELUARGA CEMARA - order.js
   ============================================= */

// =============================================
// STATE
// =============================================
const state = {
    method: null,          // 'offline' | 'online'
    offlineService: null,  // 'regular' | 'kilat' | 'dry'
    offlineRate: 5000,
    offlineWeight: 1,
    onlineService: 'regular',
    onlineRate: 5000,
    onlineWeight: 1,
    payMethod: 'cod',      // 'cod' | 'qr'
    qrTimerInterval: null,
    qrSeconds: 300,
};

// Lokasi gerai (lat, lng)
const branches = [
    { name: 'Cemara Laundry — Margonda', addr: 'Jl. Margonda Raya No. 45, Depok', lat: -6.3729, lng: 106.8317, open: true },
    { name: 'Cemara Laundry — Beji', addr: 'Jl. Nusantara Raya No. 12, Beji', lat: -6.3648, lng: 106.8255, open: true },
    { name: 'Cemara Laundry — Sawangan', addr: 'Jl. Sawangan Raya No. 88', lat: -6.4021, lng: 106.7950, open: false },
];

let leafletMap = null;
let leafletMarkers = [];

// =============================================
// NAVIGASI HALAMAN
// =============================================
function showPage(pageId) {
    document.querySelectorAll('.page-step').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) { page.classList.add('active'); }
    updateStepBar(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepBar(pageId) {
    const s1 = document.getElementById('step1ind');
    const s2 = document.getElementById('step2ind');
    const s3 = document.getElementById('step3ind');
    [s1, s2, s3].forEach(s => { s.classList.remove('active', 'done'); });
    if (pageId === 'pageStep1') { s1.classList.add('active'); }
    else if (pageId === 'pageOffline' || pageId === 'pageOnline') { s1.classList.add('done'); s2.classList.add('active'); }
    else if (pageId === 'pageQR') { s1.classList.add('done'); s2.classList.add('done'); s3.classList.add('active'); }
}

function selectMethod(m) {
    state.method = m;
    if (m === 'offline') {
        showPage('pageOffline');
        setTimeout(initMap, 100);
    } else {
        showPage('pageOnline');
        prefillFromSession();
        const dateInput = document.getElementById('oDate');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        dateInput.value = tomorrow.toISOString().split('T')[0];
        calcOnline();
    }
}

function goBack(to) {
    if (to === 'step1') showPage('pageStep1');
    else if (to === 'online') showPage('pageOnline');
}

// =============================================
// SESSION AUTO-FILL
// =============================================
function prefillFromSession() {
    const ls = localStorage.getItem('cemara_session') || sessionStorage.getItem('cemara_session');
    if (!ls) return;
    try {
        const s = JSON.parse(ls);
        if (s.name) document.getElementById('oNama').value = s.name;
        if (s.phone) document.getElementById('oPhone').value = s.phone;
    } catch (e) { }
}

// =============================================
// OFFLINE — MAPS (Leaflet)
// =============================================
function initMap() {
    if (leafletMap) { leafletMap.invalidateSize(); return; }
    const mapEl = document.getElementById('leafletMap');
    if (!mapEl) return;

    leafletMap = L.map('leafletMap', { zoomControl: true }).setView([-6.38, 106.82], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    // Custom icon
    const tealIcon = L.divIcon({
        html: `<div style="background:#0d9488;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)">
             <i style="transform:rotate(45deg);color:#fff;font-size:14px" class="bi bi-basket2-fill"></i>
           </div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36]
    });

    branches.forEach((b, i) => {
        const marker = L.marker([b.lat, b.lng], { icon: tealIcon }).addTo(leafletMap);
        marker.bindPopup(`
      <div style="font-family:Nunito,sans-serif;min-width:200px">
        <strong style="font-size:0.9rem;color:#0f172a">${b.name}</strong><br>
        <span style="font-size:0.78rem;color:#64748b">${b.addr}</span><br>
        <span style="font-size:0.75rem;font-weight:700;color:${b.open ? '#16a34a' : '#dc2626'}">${b.open ? '● Buka' : '● Tutup'}</span>
        <br><a href="https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}" target="_blank"
              style="font-size:0.78rem;color:#0d9488;font-weight:700">Buka di Maps ↗</a>
      </div>
    `);
        leafletMarkers.push(marker);
    });

    // Open first popup
    leafletMarkers[0].openPopup();
}

function focusLocation(idx, el) {
    document.querySelectorAll('.loc-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    if (leafletMap && leafletMarkers[idx]) {
        leafletMap.flyTo([branches[idx].lat, branches[idx].lng], 15, { duration: 0.8 });
        leafletMarkers[idx].openPopup();
    }
}

// =============================================
// OFFLINE — PILIH LAYANAN & KALKULASI
// =============================================
function selectService(el, svc, rate) {
    document.querySelectorAll('.spec-item').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    state.offlineService = svc;
    state.offlineRate = rate;

    const label = document.getElementById('offlineWeightLabel');
    if (svc === 'dry') {
        label.textContent = 'Jumlah (pcs)';
    } else {
        label.textContent = 'Berat (kg)';
    }
    document.getElementById('offlineCalcNote').textContent = '';
    calcOffline();
}

function calcOffline() {
    const total = state.offlineWeight * state.offlineRate;
    document.getElementById('offlineTotalPrice').textContent = formatRp(total);
}

// =============================================
// ONLINE — PILIH LAYANAN & KALKULASI
// =============================================
const svcConfig = {
    regular: { name: 'Regular', rate: 5000, unit: 'kg', est: '1×24 jam' },
    kilat: { name: 'Kilat', rate: 8000, unit: 'kg', est: '3 jam' },
    dry: { name: 'Dry Clean', rate: 25000, unit: 'pcs', est: '2×24 jam' },
};

function selectOnlineService(el, svc, rate) {
    document.querySelectorAll('.svc-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    state.onlineService = svc;
    state.onlineRate = rate;

    const cfg = svcConfig[svc];
    document.getElementById('onlineWeightLabel').textContent = `Jumlah (${cfg.unit})`;
    calcOnline();
}

function calcOnline() {
    const wInput = document.getElementById('onlineWeight');
    const w = Math.max(1, parseInt(wInput.value) || 1);
    state.onlineWeight = w;
    const cfg = svcConfig[state.onlineService];
    const total = w * state.onlineRate;

    document.getElementById('summSvc').textContent = cfg.name;
    document.getElementById('summWeight').textContent = `${w} ${cfg.unit}`;
    document.getElementById('summRate').textContent = formatRp(state.onlineRate);
    document.getElementById('summWeightLabel').textContent = cfg.unit === 'pcs' ? 'Jumlah' : 'Berat';
    document.getElementById('summTotal').textContent = formatRp(total);
    document.getElementById('summEst').textContent = cfg.est;
}

function changeWeight(mode, delta) {
    if (mode === 'offline') {
        state.offlineWeight = Math.max(1, state.offlineWeight + delta);
        document.getElementById('offlineWeight').textContent = state.offlineWeight;
        if (state.offlineService) calcOffline();
    } else {
        const input = document.getElementById('onlineWeight');
        let val = Math.max(1, (parseInt(input.value) || 1) + delta);
        input.value = val;
        state.onlineWeight = val;
        calcOnline();
    }
}

// =============================================
// PEMBAYARAN
// =============================================
function selectPay(method) {
    state.payMethod = method;
    document.getElementById('payBtnCOD').classList.remove('active');
    document.getElementById('payBtnQR').classList.remove('active');
    document.getElementById(method === 'cod' ? 'payBtnCOD' : 'payBtnQR').classList.add('active');
}

// =============================================
// SUBMIT ORDER
// =============================================
function submitOrder() {
    // Validasi
    const nama = document.getElementById('oNama').value.trim();
    const phone = document.getElementById('oPhone').value.trim();
    const alamat = document.getElementById('oAlamat').value.trim();
    const date = document.getElementById('oDate').value;
    const time = document.getElementById('oTime').value;

    if (!nama) return showToast('⚠️ Nama wajib diisi!');
    if (!phone || !/^08[0-9]{8,11}$/.test(phone)) return showToast('⚠️ Nomor WhatsApp tidak valid!');
    if (!alamat) return showToast('⚠️ Alamat wajib diisi!');
    if (!date) return showToast('⚠️ Pilih tanggal jemput!');
    if (!time) return showToast('⚠️ Pilih jam jemput!');

    // Buat objek pesanan
    const cfg = svcConfig[state.onlineService];
    const total = state.onlineWeight * state.onlineRate;
    const orderId = 'CML-' + Date.now().toString(36).toUpperCase();

    const order = {
        id: orderId,
        nama, phone, alamat,
        service: state.onlineService,
        serviceName: cfg.name,
        weight: state.onlineWeight,
        unit: cfg.unit,
        rate: state.onlineRate,
        total,
        date, time,
        note: document.getElementById('oNote').value.trim(),
        payMethod: state.payMethod,
        status: state.payMethod === 'cod' ? 'Menunggu Penjemputan' : 'Menunggu Pembayaran',
        createdAt: new Date().toISOString(),
        est: cfg.est,
    };

    // Simpan ke localStorage
    const orders = JSON.parse(localStorage.getItem('cemara_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('cemara_orders', JSON.stringify(orders));
    localStorage.setItem('cemara_last_order', JSON.stringify(order));

    if (state.payMethod === 'qr') {
        // Tampilkan halaman QR
        document.getElementById('qrAmount').textContent = formatRp(total);
        showPage('pageQR');
        startQRTimer(orderId);
    } else {
        // COD langsung ke status
        showToast('✅ Pesanan berhasil dibuat!');
        setTimeout(() => { window.location.href = 'status.html?order=' + orderId; }, 1500);
    }
}

// =============================================
// QR PAYMENT — POLLING SIMULATION
// =============================================

function startQRTimer(orderId) {
    clearInterval(state.qrTimerInterval);
    if (state.pollInterval) clearInterval(state.pollInterval);

    state.qrSeconds = 300;
    state.currentOrderId = orderId;
    updateTimerDisplay();

    // Sembunyikan tombol manual, tampilkan status polling
    const btnManual = document.getElementById('btnSudahBayar');
    const waitingBox = document.getElementById('qrWaitingBox');
    if (btnManual) btnManual.style.display = 'none';
    if (waitingBox) waitingBox.style.display = 'flex';

    // Simulasi: payment gateway akan "membalas" di antara detik ke-8 s/d 20
    // (acak agar terasa natural seperti orang beneran scan & bayar)
    const paidAtSecond = Math.floor(Math.random() * 13) + 8; // 8–20 detik
    let elapsed = 0;

    // Polling tiap 3 detik (seperti cek ke server)
    state.pollInterval = setInterval(() => {
        elapsed += 3;
        updatePollingDots();

        if (elapsed >= paidAtSecond) {
            // Pembayaran "diterima" dari gateway
            clearInterval(state.pollInterval);
            clearInterval(state.qrTimerInterval);
            onPaymentReceived(orderId);
        }
    }, 3000);

    // Countdown timer 5 menit
    state.qrTimerInterval = setInterval(() => {
        state.qrSeconds--;
        updateTimerDisplay();

        if (state.qrSeconds <= 0) {
            clearInterval(state.qrTimerInterval);
            clearInterval(state.pollInterval);
            onPaymentExpired(orderId);
        }
    }, 1000);
}

// Animasi titik-titik polling agar terasa "sedang mengecek"
let dotCount = 0;
function updatePollingDots() {
    dotCount = (dotCount + 1) % 4;
    const el = document.getElementById('qrPollingStatus');
    if (el) el.textContent = 'Menunggu pembayaran' + '.'.repeat(dotCount || 1);
}

function onPaymentReceived(orderId) {
    // Update UI dulu — tampilkan "pembayaran diterima"
    const waitingBox = document.getElementById('qrWaitingBox');
    if (waitingBox) {
        waitingBox.style.background = '#f0fdf4';
        waitingBox.style.borderColor = '#16a34a';
        waitingBox.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <i class="bi bi-check-circle-fill" style="color:#16a34a;font-size:1.4rem;"></i>
                <span style="font-size:0.95rem;font-weight:800;color:#14532d;">Pembayaran Diterima!</span>
            </div>
            <div style="font-size:0.82rem;color:#6b7280;">Mengalihkan ke halaman status pesanan...</div>
        `;
    }

    // Update data pesanan di localStorage
    const orders = JSON.parse(localStorage.getItem('cemara_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = 'Menunggu Penjemputan';
        orders[idx].paidAt = new Date().toISOString();
        localStorage.setItem('cemara_orders', JSON.stringify(orders));
        localStorage.setItem('cemara_last_order', JSON.stringify(orders[idx]));
    }

    showToast('✅ Pembayaran berhasil!');
    setTimeout(() => {
        window.location.href = 'status.html?order=' + orderId;
    }, 1800);
}

function onPaymentExpired(orderId) {
    // Update status jadi cancelled
    const orders = JSON.parse(localStorage.getItem('cemara_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = 'Dibatalkan (Kadaluarsa)';
        localStorage.setItem('cemara_orders', JSON.stringify(orders));
    }

    const waitingBox = document.getElementById('qrWaitingBox');
    if (waitingBox) {
        waitingBox.style.background = '#fff7f7';
        waitingBox.style.borderColor = '#fca5a5';
        waitingBox.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <i class="bi bi-x-circle-fill" style="color:#dc2626;font-size:1.4rem;"></i>
                <span style="font-size:0.95rem;font-weight:800;color:#7f1d1d;">Waktu Pembayaran Habis</span>
            </div>
            <div style="font-size:0.82rem;color:#6b7280;">Pesanan dibatalkan. Silakan buat pesanan baru.</div>
        `;
    }

    showToast('⚠️ Waktu bayar habis. Pesanan dibatalkan.');
    setTimeout(() => showPage('pageOnline'), 3000);
}

function updateTimerDisplay() {
    const m = Math.floor(state.qrSeconds / 60).toString().padStart(2, '0');
    const s = (state.qrSeconds % 60).toString().padStart(2, '0');
    const el = document.getElementById('qrTimer');
    if (el) {
        el.textContent = `${m}:${s}`;
        el.style.color = state.qrSeconds <= 60 ? '#ef4444' : '#0d9488';
    }
}

// =============================================
// TOAST
// =============================================
function showToast(msg) {
    const el = document.getElementById('toastNotif');
    document.getElementById('toastMsg').textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

// =============================================
// HELPER
// =============================================
function formatRp(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    showPage('pageStep1');
    calcOnline();

    // Default min date
    const dateInput = document.getElementById('oDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // Sync onlineWeight input
    const wInp = document.getElementById('onlineWeight');
    if (wInp) wInp.addEventListener('input', calcOnline);

    console.log('%cOrder Page — Cemara Laundry 🧺', 'color: #0d9488; font-weight: bold;');
});