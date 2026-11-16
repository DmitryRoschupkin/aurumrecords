"use strict";

const DATA_PATH = "data/";

let artists = [];
let tracks = [];
let studios = [];
let faqItems = [];

let activeAudio = null;
let activePreviewBtn = null;
const previewCache = new Map();
let lastSelectedArtistId = null;

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
        setupAudioPreviews();
    } catch (error) {
        console.error("Could not load About page data:", error);
        showPageError("Some page content could not be loaded. Please run the site through a local server.");
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
        card.id = `artist-card-${artist.id}`;

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
            window.jQuery(card).stop(true, true).hide().delay(index * 60).fadeIn(260);
        }
    });
}

function renderTracks(items) {
    const grid = document.querySelector("#tracksGrid");
    const status = document.querySelector("#tracksStatus");
    const count = document.querySelector("#tracksCount");
    const backBtn = document.querySelector("#backToArtistBtn");
    if (!grid) return;

    stopCurrentPreview();
    grid.replaceChildren();

    if (count) {
        count.textContent = `${items.length} ${items.length === 1 ? "track" : "tracks"}`;
    }

    if (items.length === 0) {
        if (status) {
            status.textContent = tracks.length === 0
                ? "Track information will appear here once the release catalogue is added."
                : "Nothing found. Try another search or sorting option.";
        }
        if (backBtn) backBtn.hidden = true;
        return;
    }

    if (status) status.textContent = "";
    if (backBtn) backBtn.hidden = true;

    items.forEach(track => {
        const artist = artists.find(item => item.id === track.artistId);
        const artistLabel = artist ? artist.name : "Unknown artist";

        const card = createElement("article", "track-card");
        card.dataset.artistId = String(track.artistId);

        const coverWrap = createElement("div", "track-card__cover-wrap");
        const image = createElement("img", "track-card__cover");
        image.src = track.cover;
        image.alt = track.coverAlt || `${track.title} cover`;
        image.loading = "lazy";
        coverWrap.append(image);

        const content = createElement("div", "track-card__content");
        const title = createElement("h3", "track-card__title", track.title);
        const artistName = createElement("p", "track-card__artist", artistLabel);
        const date = createElement("time", "track-card__date", formatDate(track.releaseDate));
        date.dateTime = track.releaseDate;

        const actions = createElement("div", "track-card__actions");

        const previewBtn = createElement("button", "track-card__preview", "▶ 30s Preview");
        previewBtn.type = "button";
        previewBtn.dataset.previewTrack = track.title;
        previewBtn.dataset.previewArtist = artistLabel;
        previewBtn.setAttribute("aria-label", `Play 30 second preview of ${track.title} by ${artistLabel}`);

        const liked = isTrackLiked(track.id);
        const likeButton = createElement("button", "track-card__like", liked ? "♥" : "♡");
        likeButton.type = "button";
        likeButton.dataset.likeTrackId = String(track.id);
        likeButton.classList.toggle("is-liked", liked);
        likeButton.setAttribute("aria-pressed", String(liked));
        likeButton.setAttribute(
            "aria-label",
            `${liked ? "Remove" : "Add"} ${track.title} ${liked ? "from" : "to"} favorites`
        );

        actions.append(previewBtn, likeButton);
        content.append(title, artistName, date, actions);
        card.append(coverWrap, content);
        grid.append(card);
    });
}

function stopCurrentPreview() {
    if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
    }
    if (activePreviewBtn) {
        activePreviewBtn.classList.remove("is-playing");
        activePreviewBtn.textContent = "▶ 30s Preview";
        activePreviewBtn = null;
    }
}

async function fetchItunesPreview(artist, title) {
    const cacheKey = `${artist}::${title}`.toLowerCase();
    if (previewCache.has(cacheKey)) {
        return previewCache.get(cacheKey);
    }

    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("iTunes API error");
    }

    const data = await response.json();
    const previewUrl = data.results && data.results[0] ? data.results[0].previewUrl : null;
    previewCache.set(cacheKey, previewUrl);
    return previewUrl;
}

function setupAudioPreviews() {
    const grid = document.querySelector("#tracksGrid");
    if (!grid) return;

    grid.addEventListener("click", async event => {
        const btn = event.target.closest(".track-card__preview");
        if (!btn) return;

        if (activePreviewBtn === btn) {
            stopCurrentPreview();
            return;
        }

        stopCurrentPreview();

        const artist = btn.dataset.previewArtist;
        const title = btn.dataset.previewTrack;

        btn.disabled = true;
        btn.textContent = "Loading...";

        try {
            const previewUrl = await fetchItunesPreview(artist, title);
            btn.disabled = false;

            if (!previewUrl) {
                btn.textContent = "No preview";
                setTimeout(() => {
                    btn.textContent = "▶ 30s Preview";
                }, 2000);
                return;
            }

            const audio = new Audio(previewUrl);
            activeAudio = audio;
            activePreviewBtn = btn;

            btn.classList.add("is-playing");
            btn.textContent = "❚❚ Pause";

            audio.addEventListener("ended", stopCurrentPreview);
            await audio.play();
        } catch {
            btn.disabled = false;
            btn.textContent = "Unavailable";
            setTimeout(() => {
                btn.textContent = "▶ 30s Preview";
            }, 2000);
        }
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

        const filtered = tracks.filter(track => {
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
        const artistId = Number($(this).attr("data-artist-id"));
        lastSelectedArtistId = artistId;

        highlightArtistTracks(artistId);

        const firstTrackCard = document.querySelector(`.track-card[data-artist-id="${artistId}"]`);
        const targetEl = firstTrackCard || document.getElementById("tracksStatusBar") || document.getElementById("releases");

        if (targetEl) {
            const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - 120;
            $("html, body").stop(true).animate({ scrollTop: targetTop }, 600);
        }
    });

    $("#backToArtistBtn").on("click", function () {
        if (!lastSelectedArtistId) return;
        const artistCard = document.getElementById(`artist-card-${lastSelectedArtistId}`);
        if (!artistCard) return;

        $(".artist-card").removeClass("artist-highlighted");
        $(artistCard).addClass("artist-highlighted");

        const targetTop = artistCard.getBoundingClientRect().top + window.scrollY - 115;
        $("html, body").stop(true).animate({ scrollTop: targetTop }, 600);

        setTimeout(() => {
            $(artistCard).removeClass("artist-highlighted");
        }, 2500);
    });
}

function highlightArtistTracks(artistId) {
    const artist = artists.find(item => item.id === artistId);
    const $backBtn = $("#backToArtistBtn");

    $(".track-card")
        .stop(true, true)
        .removeClass("highlighted")
        .css("opacity", 1);

    const $artistTracks = $(".track-card").filter(function () {
        return Number($(this).data("artist-id")) === artistId;
    });

    if (artist) {
        $backBtn.text(`← Back to ${artist.name}`).prop("hidden", false);
    }

    if ($artistTracks.length === 0) {
        $("#tracksStatus").text("No tracks from this artist have been added yet.");
        return;
    }

    $("#tracksStatus").text(
        `Highlighted ${$artistTracks.length} ${$artistTracks.length === 1 ? "track" : "tracks"} by ${artist ? artist.name : "this artist"}.`
    );

    $artistTracks
        .addClass("highlighted")
        .stop(true, true)
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

        const slide = createElement("div", `carousel-item studio-slide${index === 0 ? " active" : ""}`);
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