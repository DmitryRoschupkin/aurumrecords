"use strict";

const THEME_STORAGE_KEY = "aurum_theme";

function applyTheme(theme) {
    const isLight = theme === "light";
    if (isLight) {
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }

    const toggleBtn = document.querySelector("#themeToggle");
    if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", String(isLight));
        const icon = toggleBtn.querySelector(".theme-toggle__icon");
        if (icon) {
            icon.textContent = isLight ? "☾" : "☀";
        }
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    applyTheme(savedTheme);

    const toggleBtn = document.querySelector("#themeToggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
            const next = current === "light" ? "dark" : "light";
            localStorage.setItem(THEME_STORAGE_KEY, next);
            applyTheme(next);
        });
    }
}

function initPriceCalculator() {
    const pkgSelect = document.querySelector("#calcPackage");
    const hoursInput = document.querySelector("#calcHours");
    const mixingCheck = document.querySelector("#calcMixing");
    const beatCheck = document.querySelector("#calcBeat");
    const totalEl = document.querySelector("#calcTotal");

    if (!pkgSelect || !hoursInput || !totalEl) return;

    function recalculate() {
        const pkgCost = Number(pkgSelect.value) || 0;
        const hours = Math.max(0, Math.min(24, Number(hoursInput.value) || 0));
        const mixingCost = mixingCheck && mixingCheck.checked ? Number(mixingCheck.value) : 0;
        const beatCost = beatCheck && beatCheck.checked ? Number(beatCheck.value) : 0;

        const total = pkgCost + hours * 7000 + mixingCost + beatCost;
        totalEl.textContent = `${total.toLocaleString("ru-RU")} ₸`;
    }

    [pkgSelect, hoursInput, mixingCheck, beatCheck].forEach(el => {
        if (el) el.addEventListener("input", recalculate);
        if (el) el.addEventListener("change", recalculate);
    });

    recalculate();
}

const vinyl = document.querySelector(".vinyl-navigation");
const vinylRecord = document.querySelector(".vinyl-record");
const vinylSection = document.querySelector("#vinylSection");
const sections = document.querySelectorAll("section[data-title]");

let ticking = false;

window.addEventListener("scroll", () => {
    document.body.style.setProperty("--scrollTop", `${window.scrollY}px`);
    if (!ticking && vinylRecord) {
        window.requestAnimationFrame(() => {
            const rotation = window.scrollY * 0.3;
            vinylRecord.style.transform = `rotate(${rotation}deg)`;
            ticking = false;
        });
        ticking = true;
    }
});

if (vinyl && vinylSection && sections.length > 0) {
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
        threshold: 0.3
    });

    sections.forEach(section => observer.observe(section));
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initPriceCalculator();
});