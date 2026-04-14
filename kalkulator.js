/* =============================================
           LAUNDRY KELUARGA CEMARA - kalkulator.js
           Logika mirip Python, versi HTML interaktif
           ============================================= */

// === DATA MENU (setara tampil_menu() di Python) ===
const MENU_LAYANAN = [
    { id: 1, nama: "Cuci Kering", harga: 5000, unit: "kg", icon: "bi-wind" },
    { id: 2, nama: "Cuci Setrika", harga: 7000, unit: "kg", icon: "bi-thermometer-sun" },
    { id: 3, nama: "Setrika Saja", harga: 4000, unit: "kg", icon: "bi-brightness-high" },
    { id: 4, nama: "Cuci Bed Cover", harga: 15000, unit: "kg", icon: "bi-heart-fill" },
    { id: 5, nama: "Cuci Boneka", harga: 6000, unit: "kg", icon: "bi-emoji-smile" },
    { id: 6, nama: "Cuci Koper", harga: 15000, unit: "pcs", icon: "bi-briefcase-fill" },
    { id: 7, nama: "Cuci Hordeng", harga: 10000, unit: "kg", icon: "bi-columns-gap" },
    { id: 8, nama: "Cuci Karpet", harga: 20000, unit: "kg", icon: "bi-grid-3x3-gap" },
    { id: 9, nama: "Cuci Sepatu", harga: 15000, unit: "pcs", icon: "bi-wind" },
    { id: 10, nama: "Cuci Helm", harga: 10000, unit: "pcs", icon: "bi-shield-fill" },
];

let selectedLayanan = null;
let selectedUnit = 'kg';

// === RENDER MENU (setara tampil_menu() di Python) ===
function renderMenu() {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '';
    MENU_LAYANAN.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.id = 'menu-' + item.id;
        div.onclick = () => pilihLayanan(item);
        div.innerHTML = `
                    <div class="menu-num">${item.id}</div>
                    <div class="menu-info">
                        <div class="menu-name">${item.nama}</div>
                        <div class="menu-price">Rp ${item.harga.toLocaleString('id-ID')} / ${item.unit}</div>
                    </div>
                    <i class="bi bi-check-circle-fill menu-check"></i>
                `;
        grid.appendChild(div);
    });
}

// === PILIH LAYANAN ===
function pilihLayanan(item) {
    // Reset semua
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('selected'));
    // Aktifkan yang dipilih
    document.getElementById('menu-' + item.id).classList.add('selected');
    selectedLayanan = item;

    // Auto-set unit sesuai layanan
    setUnit(item.unit);

    updatePreview();
}

// === SET UNIT ===
function setUnit(unit) {
    selectedUnit = unit;
    document.getElementById('unitKg').classList.toggle('active', unit === 'kg');
    document.getElementById('unitPcs').classList.toggle('active', unit === 'pcs');
    document.getElementById('unitLabel').textContent = unit === 'kg' ? '(kg)' : '(pcs)';
    document.getElementById('inputBerat').placeholder = unit === 'kg' ? 'Contoh: 3' : 'Contoh: 2';
    updatePreview();
}

// === UPDATE PREVIEW (live hitung, setara hitung_total() di Python) ===
function updatePreview() {
    const nama = document.getElementById('inputNama').value.trim();
    const berat = parseFloat(document.getElementById('inputBerat').value);
    const btn = document.getElementById('btnHitung');

    if (selectedLayanan && nama && berat > 0) {
        const total = selectedLayanan.harga * berat;
        document.getElementById('previewTotal').textContent = formatRp(total);
        btn.disabled = false;
    } else {
        document.getElementById('previewTotal').textContent = 'Rp 0';
        btn.disabled = true;
    }
}

// === HITUNG & TAMPIL STRUK (setara blok while + print struk di Python) ===
function hitungTotal() {
    const nama = document.getElementById('inputNama').value.trim();
    const berat = parseFloat(document.getElementById('inputBerat').value);

    if (!selectedLayanan || !nama || !berat) return;

    const total = selectedLayanan.harga * berat;
    const now = new Date();
    const tgl = now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Isi struk
    document.getElementById('strukNama').textContent = nama;
    document.getElementById('strukLayanan').textContent = selectedLayanan.nama;
    document.getElementById('strukBeratLabel').textContent = selectedUnit === 'kg' ? 'Berat' : 'Jumlah';
    document.getElementById('strukBerat').textContent = berat + ' ' + selectedUnit;
    document.getElementById('strukHarga').textContent = formatRp(selectedLayanan.harga) + ' / ' + selectedUnit;
    document.getElementById('strukTotal').textContent = formatRp(total);
    document.getElementById('strukTanggal').textContent = tgl + ', ' + jam;

    // Sembunyikan form, tampilkan struk
    document.getElementById('formArea').style.display = 'none';
    const struk = document.getElementById('strukArea');
    struk.classList.add('show');
    struk.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === RESET (setara "keluar" lalu mulai lagi di Python) ===
function resetForm() {
    selectedLayanan = null;
    selectedUnit = 'kg';

    document.getElementById('inputNama').value = '';
    document.getElementById('inputBerat').value = '';
    document.getElementById('previewTotal').textContent = 'Rp 0';
    document.getElementById('btnHitung').disabled = true;
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('selected'));
    setUnit('kg');

    document.getElementById('formArea').style.display = 'block';
    document.getElementById('strukArea').classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === HELPER FORMAT RUPIAH ===
function formatRp(n) {
    return 'Rp ' + n.toLocaleString('id-ID');
}

// === INIT ===
document.addEventListener('DOMContentLoaded', function () {
    renderMenu();
    console.log('%cKalkulator Harga — Cemara Laundry 🧺', 'color: #0d9488; font-weight: bold;');
});