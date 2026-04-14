/* =============================================
   LAUNDRY KELUARGA CEMARA - script.js
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('mainNavbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });


    // ---- Smooth scroll untuk link anchor ----
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    // ---- Active nav link berdasarkan scroll ----
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + entry.target.id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(sec => sectionObserver.observe(sec));


    // ---- Scroll reveal animasi sederhana untuk service cards ----
    const revealElements = document.querySelectorAll('.service-card, .cta-section, .section-title');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });


    // ---- Update tahun copyright footer otomatis ----
    const yearEl = document.querySelector('.footer-copy');
    if (yearEl) {
        const currentYear = new Date().getFullYear();
        yearEl.innerHTML = yearEl.innerHTML.replace('2026', currentYear);
    }


    // ---- Greeting / status cepat di console (opsional debug) ----
    console.log('%cLaundry Keluarga Cemara 🧺', 'color: #0d9488; font-size: 1.2rem; font-weight: bold;');
    console.log('%cHalaman Index berhasil dimuat.', 'color: #64748b;');


    // ---- Session check: tampilkan nama user jika sudah login ----
    function getSession() {
        const ls = localStorage.getItem('cemara_session');
        const ss = sessionStorage.getItem('cemara_session');
        if (ls) return JSON.parse(ls);
        if (ss) return JSON.parse(ss);
        return null;
    }

    function clearSession() {
        localStorage.removeItem('cemara_session');
        sessionStorage.removeItem('cemara_session');
    }

    const session = getSession();
    const navAuthButtons = document.getElementById('navAuthButtons');

    if (session && navAuthButtons) {
        // Ganti tombol Login/Daftar dengan info user + tombol Logout
        navAuthButtons.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <div class="nav-user-badge">
                    <i class="bi bi-person-circle me-1"></i>
                    <span class="nav-user-name">${session.name.split(' ')[0]}</span>
                </div>
                <button class="btn btn-nav-logout btn-sm px-3" onclick="doLogout()">
                    <i class="bi bi-box-arrow-right me-1"></i>Keluar
                </button>
            </div>
        `;
    }

    window.doLogout = function () {
        clearSession();
        window.location.reload();
    };

});