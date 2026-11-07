const vinyl = document.querySelector(".vinyl-navigation");
const vinylRecord = document.querySelector(".vinyl-record");
const vinylLabel = document.querySelector(".vinyl-label");
const vinylSection = document.querySelector("#vinylSection");

const sections = document.querySelectorAll("section[data-title]");

let ticking = false;

window.addEventListener("scroll", e => {
    document.body.style.cssText = `--scrollTop: ${this.scrollY}px`;
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const rotation = window.scrollY * 0.3;

            vinylRecord.style.transform = `rotate(${rotation}deg)`;
            ticking = false;
        });

        ticking = true;
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.dataset.title === "AURUM") {
                vinyl.classList.remove("visible");
                vinyl.classList.add("hidden");
            } else {
                vinyl.classList.remove("hidden");
                vinyl.classList.add("visible");
                vinylSection.textContent = entry.target.dataset.title;
            }
        }
    });
}, {
    threshold: 0.3,
});

sections.forEach(section => {
    observer.observe(section);
})