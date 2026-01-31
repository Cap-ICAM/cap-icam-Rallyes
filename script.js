// --- PWA & Navigation Logic ---
let deferredPrompt;

// 1. Detection Utilities
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// 2. DOM Elements
const installBtnItem = document.createElement('li');
installBtnItem.id = 'install-item';
installBtnItem.style.display = 'none';
installBtnItem.innerHTML = '<a href="#" class="btn-install"><i class="fas fa-download"></i> App</a>';

// 3. Helper Functions
function showInstallButton(label) {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('install-item')) {
        navLinks.appendChild(installBtnItem);
        if (label) installBtnItem.querySelector('a').innerHTML = label;
        installBtnItem.style.display = 'block';
    }
}

// 4. PWA Installation Event (Chrome/Android/PC)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton('<i class="fas fa-download"></i> Installer');
});

// 5. iOS Handling (Manual instructions)
if (isIOS && !isStandalone) {
    setTimeout(() => {
        showInstallButton('<i class="fas fa-plus-circle"></i> Installer App');
    }, 1000);
}

// 6. Handle Clicks on Install Button
installBtnItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (isIOS) {
        alert('⚓ INSTALLATION IPHONE :\n\n1. Clique sur le bouton "Partager" en bas (le carré avec une flèche ↑)\n2. Fais défiler et clique sur "Sur l\'écran d\'accueil"\n3. Clique sur "Ajouter" en haut à droite.\n\nCap\'Icam sera alors sur ton écran comme une vraie application !');
    } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                installBtnItem.style.display = 'none';
            }
            deferredPrompt = null;
        });
    } else {
        alert('⚓ Pour installer l\'application, utilise le menu de ton navigateur et cherche "Installer" ou "Ajouter à l\'écran d\'accueil".');
    }
});

// 7. Smooth Scroll to Top (Logo Click)
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

// 8. Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log('SW Registration failed', err));
    });
}

// --- Original Website Logic ---

function openModal(rallyeName) {
    const modal = document.getElementById('orderModal');
    const rallyeTitleSpan = document.getElementById('rallyeName');
    rallyeTitleSpan.textContent = rallyeName;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynHcmZfCoMbwtZO8KLwHl5Kpr3X2OL365F_hcFuqDN46glEVOsefsK6vVXexB_wTmzpA/exec';

document.getElementById('rallyeForm').addEventListener('submit', function (e) {
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
navSlide();
