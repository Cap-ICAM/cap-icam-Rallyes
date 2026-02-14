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

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJG1Umt06zomtl9rZit_tY7JrGoh5S8WpmYIV2FSp3COI7mMNu0Vv7XxvWca8J9RZhag/exec';

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

// --- Countdown Logic ---
const countdownDate = new Date("March 20, 2026 20:00:00").getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        const countdownElement = document.getElementById("countdown-bar");
        if (countdownElement) {
            countdownElement.innerHTML = "<span class='countdown-label'>🏁 Les votes sont clos ! Merci à tous ! 🏁</span>";
        }
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysElem = document.getElementById("days");
    const hoursElem = document.getElementById("hours");
    const minutesElem = document.getElementById("minutes");
    const secondsElem = document.getElementById("seconds");

    if (daysElem && hoursElem && minutesElem && secondsElem) {
        daysElem.innerText = days < 10 ? "0" + days : days;
        hoursElem.innerText = hours < 10 ? "0" + hours : hours;
        minutesElem.innerText = minutes < 10 ? "0" + minutes : minutes;
        secondsElem.innerText = seconds < 10 ? "0" + seconds : seconds;
    }
}

// Update every second
setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call

// --- Music Player Logic ---
const musicBtn = document.getElementById('music-btn');
const audioPlayer = document.getElementById('audio-player');

if (musicBtn && audioPlayer) {
    musicBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                musicBtn.textContent = '⏸️'; // Change icon to Pause
                musicBtn.classList.add('music-playing');
            }).catch(error => {
                console.log("Lecture bloquée par le navigateur (autoplay policy) : " + error);
                alert("Impossible de lancer la musique. Vérifie que le fichier est bien présent !");
            });
        } else {
            audioPlayer.pause();
            musicBtn.textContent = '🎵'; // Change icon back to Music Note
            musicBtn.classList.remove('music-playing');
        }
    });
}

// --- Parallax Effect ---
window.addEventListener('scroll', function () {
    const scrollPosition = window.pageYOffset;
    const heroLogo = document.querySelector('.hero-logo');
    const heroText = document.querySelector('.hero h1');
    const heroTagline = document.querySelector('.tagline');

    if (heroLogo) {
        heroLogo.style.transform = 'translateY(' + scrollPosition * 0.15 + 'px)';
        heroLogo.style.opacity = 1 - (scrollPosition / 700);
    }
    if (heroText) {
        heroText.style.transform = 'translateY(' + scrollPosition * 0.25 + 'px)';
        heroText.style.opacity = 1 - (scrollPosition / 600);
    }
    if (heroTagline) {
        heroTagline.style.transform = 'translateY(' + scrollPosition * 0.35 + 'px)';
        heroTagline.style.opacity = 1 - (scrollPosition / 500);
    }
});
