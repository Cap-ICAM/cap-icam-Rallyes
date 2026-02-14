// --- Navigation Logic ---

// 1. Smooth Scroll to Top (Logo Click)
const logoContainer = document.querySelector('.logo-container');
if (logoContainer) {
    logoContainer.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState("", document.title, window.location.pathname + window.location.search);

        // Close menu if open (mobile)
        const nav = document.querySelector('.nav-links');
        const burger = document.querySelector('.hamburger');
        if (nav && nav.classList.contains('nav-active')) {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        }
    });
}

// 2. Mobile Navigation Toggle
const navSlide = () => {
    const burger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        burger.classList.toggle('toggle');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
            navLinks.forEach(link => { link.style.animation = ''; });
        });
    });
}

// --- Order System Logic ---

function openModal(rallyeName) {
    const modal = document.getElementById('orderModal');
    const rallyeTitleSpan = document.getElementById('rallyeName');
    rallyeTitleSpan.textContent = rallyeName;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeModal();
    }
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynHcmZfCoMbwtZO8KLwHl5Kpr3X2OL365F_hcFuqDN46glEVOsefsK6vVXexB_wTmzpA/exec';

const rallyeForm = document.getElementById('rallyeForm');
if (rallyeForm) {
    rallyeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = document.querySelector('.btn-submit');
        const originalText = btn.textContent;
        btn.textContent = 'Envoi en cours... 🌊';
        btn.disabled = true;

        const formData = {
            rallye: document.getElementById('rallyeName').textContent,
            name: document.getElementById('name').value,
            location: document.getElementById('location').value,
            phone: document.getElementById('phone').value,
            notes: document.getElementById('notes').value
        };

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(() => {
                alert('⚓ Commande envoyée au QG ! Nos marins arrivent !');
                closeModal();
                e.target.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Oups, une erreur est survenue. Vérifie ta connexion.');
            })
            .finally(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            });
    });
}

// Initialize Everything
navSlide();
