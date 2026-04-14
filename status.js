/* =============================================
   LAUNDRY KELUARGA CEMARA - status.js
   ============================================= */

// Status flow untuk progress tracker
const STATUS_FLOW = [
    { key: 'Menunggu Pembayaran', icon: 'bi-qr-code-scan', label: 'Menunggu Bayar' },
    { key: 'Menunggu Penjemputan', icon: 'bi-clock-history', label: 'Menunggu Jemput' },
    { key: 'Dijemput', icon: 'bi-truck', label: 'Dijemput' },
    { key: 'Dicuci', icon: 'bi-basket2-fill', label: 'Dicuci' },
    { key: 'Disetrika', icon: 'bi-snow2', label: 'Disetrika' },
    { key: 'Siap Antar', icon: 'bi-bag-check-fill', label: 'Siap Antar' },
    { key: 'Selesai', icon: 'bi-check-circle-fill', label: 'Selesai' },
];

let allOrders = [];
let activeFilter = 'all';
let searchText = '';

// =============================================
// LOAD ORDERS
// =============================================
function loadOrders() {
    allOrders = JSON.parse(localStorage.getItem('cemara_orders') || '[]');

    // Jika halaman baru dibuka setelah bayar/order, highlight pesanan terbaru
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('order');
    if (highlightId) {
        // Scroll ke pesanan itu setelah render
        setTimeout(() => {
            const el = document.getElementById('card-' + highlightId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.borderColor = 'var(--primary)';
                el.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.25)';
                // Auto-buka detail
                const order = allOrders.find(o => o.id === highlightId);
                if (order) setTimeout(() => openDetail(order), 600);
            }
        }, 300);
    }

    renderOrders();
}

function renderOrders() {
    const container = document.getElementById('ordersList');
    const empty = document.getElementById('emptyState');
    container.innerHTML = '';

    let filtered = allOrders.filter(o => {
        const matchSearch = !searchText ||
            o.id.toLowerCase().includes(searchText) ||
            o.nama.toLowerCase().includes(searchText);
        const matchStatus = activeFilter === 'all' ||
            o.status.toLowerCase().includes(activeFilter.toLowerCase());
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    filtered.forEach((order, idx) => {
        const card = buildOrderCard(order, idx);
        container.appendChild(card);
    });
}

function buildOrderCard(order, idx) {
    const div = document.createElement('div');
    const statusClass = getStatusClass(order.status);
    div.className = `order-card ${statusClass}`;
    div.id = 'card-' + order.id;
    div.style.animationDelay = (idx * 0.06) + 's';
    div.onclick = () => openDetail(order);

    const date = new Date(order.createdAt);
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const progressHTML = buildProgressBar(order.status);
    const badgeClass = getBadgeClass(order.status);

    div.innerHTML = `
    <div class="oc-top">
      <div>
        <div class="oc-id">${order.id}</div>
        <div class="oc-name">${order.nama}</div>
      </div>
      <span class="oc-status-badge ${badgeClass}">${order.status}</span>
    </div>
    <div class="oc-info">
      <div class="oc-info-item">
        <i class="bi bi-basket2"></i>
        <strong>${order.serviceName}</strong>
      </div>
      <div class="oc-info-item">
        <i class="bi bi-droplet"></i>
        <strong>${order.weight} ${order.unit}</strong>
      </div>
      <div class="oc-info-item">
        <i class="bi bi-calendar3"></i>
        <strong>${dateStr}</strong>
      </div>
      <div class="oc-info-item">
        <i class="bi bi-${order.payMethod === 'cod' ? 'cash-coin' : 'qr-code-scan'}"></i>
        <strong>${order.payMethod === 'cod' ? 'COD' : 'QRIS'}</strong>
      </div>
    </div>
    ${progressHTML}
    <div class="oc-bottom">
      <div class="oc-total">${formatRp(order.total)}</div>
      <div class="oc-detail-link">Lihat Detail <i class="bi bi-chevron-right"></i></div>
    </div>
  `;
    return div;
}

function buildProgressBar(currentStatus) {
    const steps = STATUS_FLOW.filter(s => s.key !== 'Menunggu Pembayaran');
    const currentIdx = steps.findIndex(s => s.key === currentStatus);

    let html = '<div class="order-progress">';
    steps.forEach((s, i) => {
        let cls = '';
        if (i < currentIdx) cls = 'done';
        else if (i === currentIdx) cls = 'current';
        html += `<div class="prog-step ${cls}">
      <i class="bi ${s.icon}"></i>${s.label}
    </div>`;
    });
    html += '</div>';
    return html;
}

// =============================================
// DETAIL MODAL
// =============================================
function openDetail(order) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    modal.classList.remove('d-none');
    document.body.style.overflow = 'hidden';

    const date = new Date(order.createdAt);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const badgeClass = getBadgeClass(order.status);

    const progressHTML = buildModalProgress(order.status);

    content.innerHTML = `
    <div class="modal-order-id">${order.id}</div>
    <div class="modal-order-name">${order.nama}</div>
    <div class="modal-status-row">
      <span class="oc-status-badge ${badgeClass}">${order.status}</span>
    </div>

    ${progressHTML}

    <div class="detail-section">
      <div class="detail-sec-title">📦 Detail Pesanan</div>
      <div class="detail-row"><span>Layanan</span><strong>${order.serviceName}</strong></div>
      <div class="detail-row"><span>${order.unit === 'pcs' ? 'Jumlah' : 'Berat'}</span><strong>${order.weight} ${order.unit}</strong></div>
      <div class="detail-row"><span>Harga/satuan</span><strong>${formatRp(order.rate)}</strong></div>
      <div class="detail-row"><span>Estimasi</span><strong>${order.est}</strong></div>
      ${order.note ? `<div class="detail-row"><span>Catatan</span><strong>${order.note}</strong></div>` : ''}
    </div>

    <div class="detail-section">
      <div class="detail-sec-title">🚚 Penjemputan</div>
      <div class="detail-row"><span>Tanggal Jemput</span><strong>${formatDate(order.date)}</strong></div>
      <div class="detail-row"><span>Jam</span><strong>${order.time}</strong></div>
      <div class="detail-row"><span>Alamat</span><strong>${order.alamat}</strong></div>
      <div class="detail-row"><span>No. WhatsApp</span><strong>${order.phone}</strong></div>
    </div>

    <div class="detail-section">
      <div class="detail-sec-title">💳 Pembayaran</div>
      <div class="detail-row"><span>Metode</span><strong>${order.payMethod === 'cod' ? 'COD (Bayar saat jemput)' : 'QRIS'}</strong></div>
      <div class="detail-row"><span>Tanggal Pesan</span><strong>${dateStr}, ${timeStr}</strong></div>
    </div>

    <div class="modal-total-box">
      <span class="modal-total-label">Total Pembayaran</span>
      <span class="modal-total-val">${formatRp(order.total)}</span>
    </div>

    <button class="btn-wa-contact" onclick="contactWA('${order.id}', '${order.nama}', '${order.phone}')">
      <i class="bi bi-whatsapp"></i> Hubungi via WhatsApp
    </button>
  `;
}

function buildModalProgress(currentStatus) {
    const statusFlow = STATUS_FLOW.filter(s => s.key !== 'Menunggu Pembayaran');
    const currentIdx = statusFlow.findIndex(s => s.key === currentStatus);

    let html = '<div class="modal-progress">';
    statusFlow.forEach((s, i) => {
        let cls = '';
        if (i < currentIdx) cls = 'done';
        else if (i === currentIdx) cls = 'current';
        html += `
      <div class="mp-step ${cls}">
        <div class="mp-dot"><i class="bi ${s.icon}"></i></div>
        <div class="mp-text">
          <strong>${s.label}</strong>
          <small>${i < currentIdx ? 'Selesai' : i === currentIdx ? 'Sedang berlangsung' : 'Menunggu'}</small>
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
}

function closeModalBtn() {
    document.getElementById('detailModal').classList.add('d-none');
    document.body.style.overflow = '';
}

function closeModal(e) {
    if (e.target === document.getElementById('detailModal')) {
        closeModalBtn();
    }
}

function contactWA(id, nama, phone) {
    const msg = `Halo Admin Cemara Laundry 👋\n\nSaya ingin menanyakan status pesanan:\n🆔 ID: ${id}\n👤 Nama: ${nama}\n\nMohon infonya ya. Terima kasih!`;
    window.open('https://wa.me/62085717642656?text=' + encodeURIComponent(msg), '_blank');
}

// =============================================
// FILTER & SEARCH
// =============================================
function filterByStatus(status, btn) {
    activeFilter = status;
    document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrders();
}

function filterOrders() {
    searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    renderOrders();
}

// =============================================
// HELPERS
// =============================================
function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s.includes('menunggu')) return 'status-menunggu';
    if (s.includes('dijemput')) return 'status-dijemput';
    if (s.includes('dicuci')) return 'status-dicuci';
    if (s.includes('selesai')) return 'status-selesai';
    if (s.includes('dibatalkan')) return 'status-dibatalkan';
    return 'status-menunggu';
}

function getBadgeClass(status) {
    const s = status.toLowerCase();
    if (s.includes('pembayaran')) return 'badge-menunggu';
    if (s.includes('penjemputan')) return 'badge-menunggu';
    if (s.includes('dijemput')) return 'badge-dijemput';
    if (s.includes('dicuci')) return 'badge-dicuci';
    if (s.includes('setrika')) return 'badge-setrika';
    if (s.includes('selesai')) return 'badge-selesai';
    if (s.includes('dibatalkan')) return 'badge-dibatalkan';
    return 'badge-menunggu';
}

function formatRp(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    loadOrders();



    console.log('%cStatus Page — Cemara Laundry 🧺', 'color: #0d9488; font-weight: bold;');
});