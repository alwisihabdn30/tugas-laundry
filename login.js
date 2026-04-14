/* =============================================
   LAUNDRY KELUARGA CEMARA - login.js
   Data user disimpan di localStorage (per browser/device)
   ============================================= */

// =============================================
// HELPERS: localStorage user management
// =============================================

/**
 * Ambil semua user yang terdaftar dari localStorage
 */
function getUsers() {
    return JSON.parse(localStorage.getItem('cemara_users') || '[]');
}

/**
 * Simpan array user ke localStorage
 */
function saveUsers(users) {
    localStorage.setItem('cemara_users', JSON.stringify(users));
}

/**
 * Simpan sesi user yang sedang login
 */
function saveSession(user, remember) {
    const sessionData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        loggedAt: new Date().toISOString()
    };
    if (remember) {
        localStorage.setItem('cemara_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('cemara_session', JSON.stringify(sessionData));
    }
}

/**
 * Ambil sesi aktif (cek localStorage dulu, lalu sessionStorage)
 */
function getSession() {
    const ls = localStorage.getItem('cemara_session');
    const ss = sessionStorage.getItem('cemara_session');
    if (ls) return JSON.parse(ls);
    if (ss) return JSON.parse(ss);
    return null;
}

/**
 * Hapus sesi (logout)
 */
function clearSession() {
    localStorage.removeItem('cemara_session');
    sessionStorage.removeItem('cemara_session');
}

// =============================================
// UI HELPERS
// =============================================

function showAlert(id, type, message) {
    const el = document.getElementById(id);
    el.className = `auth-alert alert-${type}`;
    const icon = type === 'danger'
        ? '<i class="bi bi-exclamation-circle-fill"></i>'
        : '<i class="bi bi-check-circle-fill"></i>';
    el.innerHTML = icon + ' ' + message;
    el.classList.remove('d-none');
}

function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('d-none');
}

function setInputState(id, state) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('error', 'success');
    if (state) el.classList.add(state);
}

// =============================================
// TAB SWITCH
// =============================================

function switchTab(tab) {
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        formLogin.classList.remove('d-none');
        formRegister.classList.add('d-none');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        hideAlert('loginAlert');
    } else {
        formLogin.classList.add('d-none');
        formRegister.classList.remove('d-none');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        hideAlert('registerAlert');
    }
}

// =============================================
// TOGGLE PASSWORD VISIBILITY
// =============================================

function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash-fill';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye-fill';
    }
}

// =============================================
// PASSWORD STRENGTH
// =============================================

function checkStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

const regPasswordInput = document.getElementById('regPassword');
if (regPasswordInput) {
    regPasswordInput.addEventListener('input', function () {
        const val = this.value;
        const score = checkStrength(val);
        const bar = document.getElementById('strengthBar');
        const label = document.getElementById('strengthLabel');

        const levels = [
            { pct: '0%', color: '', text: '' },
            { pct: '25%', color: '#ef4444', text: 'Sangat Lemah' },
            { pct: '45%', color: '#f97316', text: 'Lemah' },
            { pct: '65%', color: '#eab308', text: 'Cukup' },
            { pct: '85%', color: '#22c55e', text: 'Kuat' },
            { pct: '100%', color: '#0d9488', text: 'Sangat Kuat' },
        ];

        const lv = levels[Math.min(score, 5)];
        bar.style.width = lv.pct;
        bar.style.background = lv.color;
        label.textContent = lv.text;
        label.style.color = lv.color;
    });
}

// =============================================
// REGISTER
// =============================================

function doRegister() {
    hideAlert('registerAlert');

    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const agree = document.getElementById('agreeTerms').checked;

    // Reset state
    ['regName', 'regPhone', 'regEmail', 'regPassword', 'regConfirm'].forEach(id => setInputState(id, null));

    // Validasi
    if (!name) {
        setInputState('regName', 'error');
        return showAlert('registerAlert', 'danger', 'Nama lengkap wajib diisi.');
    }
    if (!phone || !/^08[0-9]{8,11}$/.test(phone)) {
        setInputState('regPhone', 'error');
        return showAlert('registerAlert', 'danger', 'Nomor HP tidak valid. Contoh: 08123456789');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setInputState('regEmail', 'error');
        return showAlert('registerAlert', 'danger', 'Format email tidak valid.');
    }
    if (password.length < 6) {
        setInputState('regPassword', 'error');
        return showAlert('registerAlert', 'danger', 'Password minimal 6 karakter.');
    }
    if (password !== confirm) {
        setInputState('regConfirm', 'error');
        return showAlert('registerAlert', 'danger', 'Konfirmasi password tidak cocok.');
    }
    if (!agree) {
        return showAlert('registerAlert', 'danger', 'Harap setujui syarat & ketentuan.');
    }

    // Cek email duplikat
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        setInputState('regEmail', 'error');
        return showAlert('registerAlert', 'danger', 'Email sudah terdaftar. Silakan login.');
    }

    // Simpan user baru
    const newUser = {
        id: Date.now(),
        name,
        phone,
        email,
        password,  // catatan: produksi nyata harus di-hash di server
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    // Langsung login
    saveSession(newUser, true);
    showSuccessCard(`Halo, ${name}! 🎉`, 'Akun berhasil dibuat. Selamat datang di Cemara Laundry!');
}

// =============================================
// LOGIN
// =============================================

function doLogin() {
    hideAlert('loginAlert');

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;

    // Reset
    setInputState('loginEmail', null);
    setInputState('loginPassword', null);

    if (!email) {
        setInputState('loginEmail', 'error');
        return showAlert('loginAlert', 'danger', 'Email wajib diisi.');
    }
    if (!password) {
        setInputState('loginPassword', 'error');
        return showAlert('loginAlert', 'danger', 'Password wajib diisi.');
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        setInputState('loginEmail', 'error');
        setInputState('loginPassword', 'error');
        return showAlert('loginAlert', 'danger', 'Email atau password salah.');
    }

    // Simpan sesi
    saveSession(user, remember);
    setInputState('loginEmail', 'success');
    setInputState('loginPassword', 'success');

    showSuccessCard(`Selamat Datang, ${user.name}! 👋`, 'Kamu berhasil masuk ke akun Cemara Laundry.');
}

// =============================================
// SUCCESS CARD & REDIRECT
// =============================================

function showSuccessCard(title, msg) {
    document.getElementById('authCard').classList.add('d-none');
    const sc = document.getElementById('successCard');
    sc.classList.remove('d-none');

    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMsg').textContent = msg;

    // Animasi progress bar redirect
    setTimeout(() => {
        document.getElementById('redirectFill').style.width = '100%';
    }, 100);

    // Redirect ke index setelah 2.7 detik
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2800);
}

// =============================================
// LUPA PASSWORD INFO
// =============================================

function showForgotInfo() {
    showAlert('loginAlert', 'danger',
        '<i class="bi bi-info-circle-fill"></i> Hubungi admin via WhatsApp untuk reset password.');
}

// =============================================
// ENTER KEY SUPPORT
// =============================================

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const loginForm = document.getElementById('formLogin');
        const registerForm = document.getElementById('formRegister');
        if (!loginForm.classList.contains('d-none')) doLogin();
        if (!registerForm.classList.contains('d-none')) doRegister();
    }
});

// =============================================
// CEK HASH URL (dari index.html tombol "Daftar")
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#register') {
        switchTab('register');
    }

    // Jika sudah login, langsung redirect
    const session = getSession();
    if (session) {
        window.location.href = 'index.html';
    }

    console.log('%cLogin Page - Cemara Laundry 🧺', 'color: #0d9488; font-weight: bold;');
});