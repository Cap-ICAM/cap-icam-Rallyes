// --- Countdown Logic ---
const countdownDate = new Date("March 20, 2026 20:00:00").getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        const countdownElement = document.getElementById("countdown");
        if (countdownElement) {
            countdownElement.innerHTML = "Les votes sont clos ! 🏁";
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
