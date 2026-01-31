// --- PWA Installation Logic ---
let deferredPrompt;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// Create the install/help button
const installBtnItem = document.createElement('li');
installBtnItem.id = 'install-item';
installBtnItem.style.display = 'none';
installBtnItem.innerHTML = '<a href="#" class="btn-install"><i class="fas fa-download"></i> App</a>';

console.log('PWA Logic Initialized');

// Handle the "beforeinstallprompt" event (Chrome/Edge/Android)
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;

    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('install-item')) {
        navLinks.appendChild(installBtnItem);
        installBtnItem.style.display = 'block';
    }
});

// If it's iOS and not already installed, show the button as an "Instruction" button
if (isIOS && !isStandalone) {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.appendChild(installBtnItem);
        installBtnItem.style.display = 'block';
        installBtnItem.querySelector('a').innerHTML = '<i class="fas fa-info-circle"></i> Installer App';
    }
}

// Logic for clicking the install button
installBtnItem.addEventListener('click', (e) => {
    e.preventDefault();

    if (isIOS) {
        alert('⚓ Pour installer Cap\'Icam sur ton iPhone :\n\n1. Clique sur le bouton "Partager" ↑\n2. Choisis "Sur l\'écran d\'accueil"\n3. C\'est prêt !');
    } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBtnItem.style.display = 'none';
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed.');
    installBtnItem.style.display = 'none';
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log('SW Registration failed', err));
    });
}

// --- Original Logic ---
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

// Close if click outside
window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Handle Form Submission
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbynHcmZfCoMbwtZO8KLwHl5Kpr3X2OL365F_hcFuqDN46glEVOsefsK6vVXexB_wTmzpA/exec';

document.getElementById('rallyeForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const btn = document.querySelector('.btn-submit');
    const originalText = btn.textContent;

    // Loading State
    btn.textContent = 'Envoi en cours... 🌊';
    btn.disabled = true;

    // Collect Data
    const formData = {
        rallye: document.getElementById('rallyeName').textContent,
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        phone: document.getElementById('phone').value,
        notes: document.getElementById('notes').value
    };

    // Send Data
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Sheets
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(() => {
            // Success
            alert('⚓ Commande envoyée au QG ! Nos marins arrivent !');
            closeModal();
            e.target.reset();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Oups, une erreur est survenue. Vérifie ta connexion.');
        })
        .finally(() => {
            // Reset Button
            btn.textContent = originalText;
            btn.disabled = false;
        });
});

// Mobile Navigation Logic
const navSlide = () => {
    const burger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    // Toggle Nav
    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');

            // Reset animations
            navLinks.forEach(link => {
                link.style.animation = '';
            });
        });
    });
}

navSlide();
