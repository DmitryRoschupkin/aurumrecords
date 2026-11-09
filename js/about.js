"use strict";

const DATA_PATH = "data/";

let artists = [];
let tracks = [];
let studios = [];
let faqItems = [];

document.addEventListener("DOMContentLoaded", initAboutPage);

async function initAboutPage() {
    try {
        const [artistsData, tracksData, studiosData, faqData] = await Promise.all([
            fetchJson("artists.json"),
            fetchJson("tracks.json"),
            fetchJson("studios.json"),
            fetchJson("faq.json")
        ]);

        artists = artistsData;
        tracks = tracksData;
        studios = studiosData;
        faqItems = faqData;

        renderArtists(artists);
        renderTracks(tracks);
        renderStudios(studios);
        renderFaq(faqItems);
        setupTrackControls();
        setupArtistTrackNavigation();
    } catch (error) {
        console.error("Could not load About page data:", error);
        showPageError("Some page content could not be loaded. Please check the JSON paths and run the site through a local server.");
    }
}

async function fetchJson(filename) {
    const response = await fetch(DATA_PATH + filename);

    if (!response.ok) {
        throw new Error(`Failed to load ${filename}: HTTP ${response.status}`);
    }

    return response.json();
}

function showPageError(message) {
    const container = document.querySelector("#aboutStatus");
    if (container) {
        container.textContent = message;
        container.hidden = false;
    }
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function renderArtists(items) {
    const grid = document.querySelector("#artistsGrid");
    if (!grid) return;

    grid.replaceChildren();

    if (items.length === 0) {
        grid.append(createElement("p", "empty-state", "No artists are available yet."));
        return;
    }

    items.forEach((artist, index) => {
        const card = createElement("article", "artist-card");
        const image = createElement("img", "artist-card__image");
        image.src = artist.image;
        image.alt = artist.alt || `${artist.name} artist portrait`;
        image.loading = "lazy";

        const content = createElement("div", "artist-card__content");
        const genre = createElement("p", "artist-card__genre", artist.genre);
        const title = createElement("h3", "artist-card__name", artist.name);
        const description = createElement("p", "artist-card__description", artist.description);

        const button = createElement("button", "artist-card__button", "See artist tracks!");
        button.type = "button";
        button.dataset.artistId = String(artist.id);
        button.setAttribute("aria-label", `Show tracks by ${artist.name}`);

        content.append(genre, title, description, button);
        card.append(image, content);
        grid.append(card);

        if (window.jQuery) {
            window.jQuery(card).hide().delay(index * 70).fadeIn(280);
        }
    });
}

function renderTracks(items) {
    const grid = document.querySelector("#tracksGrid");
    const status = document.querySelector("#tracksStatus");
    const count = document.querySelector("#tracksCount");
    if (!grid) return;

    grid.replaceChildren();

    if (count) {
        count.textContent = `${items.length} ${items.length === 1 ? "track" : "tracks"}`;
    }

    if (items.length === 0) {
        if (status) status.textContent = tracks.length === 0
            ? "Track information will appear here once the release catalogue is added."
            : "Nothing found. Try another search or sorting option.";
        return;
    }

    if (status) status.textContent = "";

    items.forEach(track => {
        const artist = artists.find(item => item.id === track.artistId);
        const card = createElement("article", "track-card");
        card.dataset.artistId = String(track.artistId);

        const image = createElement("img", "track-card__cover");
        image.src = track.cover;
        image.alt = track.coverAlt || `${track.title} cover`;
        image.loading = "lazy";

        const content = createElement("div", "track-card__content");
        const title = createElement("h3", "track-card__title", track.title);
        const artistName = createElement("p", "track-card__artist", artist ? artist.name : "Unknown artist");
        const date = createElement("time", "track-card__date", formatDate(track.releaseDate));
        date.dateTime = track.releaseDate;

        content.append(title, artistName, date);
        card.append(image, content);
        grid.append(card);
    });
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Release date unavailable";

    return new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function setupTrackControls() {
    const searchInput = document.querySelector("#trackSearch");
    const sortSelect = document.querySelector("#trackSort");

    function updateTracks() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const sortOrder = sortSelect ? sortSelect.value : "newest";

        let filtered = tracks.filter(track => {
            const artist = artists.find(item => item.id === track.artistId);
            const searchableText = `${track.title} ${artist ? artist.name : ""}`.toLowerCase();
            return searchableText.includes(query);
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.releaseDate).getTime() || 0;
            const dateB = new Date(b.releaseDate).getTime() || 0;
            return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
        });

        renderTracks(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", updateTracks);
    if (sortSelect) sortSelect.addEventListener("change", updateTracks);
}

function setupArtistTrackNavigation() {
    $("#artistsGrid").on("click", ".artist-card__button", function () {

        const artistId = Number($(this).data("artist-id"));
        const $releases = $("#releases");

        $("html, body").stop(true).animate({
            scrollTop: $releases.offset().top - 90
        }, 650);

        highlightArtistTracks(artistId);
    });
}

function highlightArtistTracks(artistId) {
    $(".track-card")
        .stop(true, true)
        .removeClass("highlighted")
        .css("opacity", 1);

    const $artistTracks = $(".track-card").filter(function () {
        return Number($(this).data("artist-id")) === artistId;
    });

    if ($artistTracks.length === 0) {
        $("#tracksStatus").text(
            "No tracks from this artist have been added yet."
        );
        return;
    }

    $("#tracksStatus").text(
        `Found ${$artistTracks.length} tracks by this artist.`
    );

    $artistTracks
        .addClass("highlighted")
        .hide()
        .fadeIn(350);
}

function renderStudios(items) {
    const container = document.querySelector("#studiosCarouselContent");
    const indicators = document.querySelector("#studiosCarouselIndicators");
    if (!container || !indicators) return;

    container.replaceChildren();
    indicators.replaceChildren();

    if (items.length === 0) {
        container.append(createElement("p", "empty-state", "Studio information is not available yet."));
        return;
    }

    items.forEach((studio, index) => {
        const indicator = createElement("button");
        indicator.type = "button";
        indicator.dataset.bsTarget = "#studiosCarousel";
        indicator.dataset.bsSlideTo = String(index);
        indicator.setAttribute("aria-label", `Slide ${index + 1}`);
        if (index === 0) {
            indicator.classList.add("active");
            indicator.setAttribute("aria-current", "true");
        }
        indicators.append(indicator);

        const slide = createElement("div", `carousel-item${index === 0 ? " active" : ""}`);
        const image = createElement("img", "d-block w-100 studio-slide__image");
        image.src = studio.image;
        image.alt = studio.alt || studio.name;
        image.loading = "lazy";

        const caption = createElement("div", "carousel-caption studio-slide__caption");
        const title = createElement("h3", "", studio.name);
        const description = createElement("p", "", studio.description);
        caption.append(title, description);
        slide.append(image, caption);
        container.append(slide);
    });
}

function renderFaq(items) {
    const container = document.querySelector("#faqAccordion");
    if (!container) return;

    container.replaceChildren();

    items.forEach((item, index) => {
        const accordionItem = createElement("div", "accordion-item");
        const heading = createElement("h3", "accordion-header");
        heading.id = `faq-heading-${item.id}`;

        const button = createElement("button", "accordion-button" + (index === 0 ? "" : " collapsed"), item.question);
        button.type = "button";
        button.dataset.bsToggle = "collapse";
        button.dataset.bsTarget = `#faq-collapse-${item.id}`;
        button.setAttribute("aria-expanded", index === 0 ? "true" : "false");
        button.setAttribute("aria-controls", `faq-collapse-${item.id}`);

        const collapse = createElement("div", "accordion-collapse collapse" + (index === 0 ? " show" : ""));
        collapse.id = `faq-collapse-${item.id}`;
        collapse.dataset.bsParent = "#faqAccordion";
        collapse.setAttribute("aria-labelledby", heading.id);

        const body = createElement("div", "accordion-body", item.answer);
        heading.append(button);
        collapse.append(body);
        accordionItem.append(heading, collapse);
        container.append(accordionItem);
    });
}