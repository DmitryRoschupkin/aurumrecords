"use strict";

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("current_user"));
    } catch {
        return null;
    }
}

function getLikedIds() {
    const user = getCurrentUser();
    if (!user || !Array.isArray(user.likedTracks)) {
        return [];
    }
    return user.likedTracks.map(Number);
}

function saveLikedTracks(email, likedTracks) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(user => user.email === email);
    if (userIndex === -1) return false;

    const uniqueIds = [...new Set(likedTracks.map(Number))];
    users[userIndex].likedTracks = uniqueIds;

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("current_user", JSON.stringify(users[userIndex]));
    return true;
}

function isTrackLiked(trackId) {
    return getLikedIds().includes(Number(trackId));
}

function toggleTrackLike(trackId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return null;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(item => item.email === currentUser.email);
    if (!user) return null;

    if (!Array.isArray(user.likedTracks)) {
        user.likedTracks = [];
    }

    const id = Number(trackId);
    if (user.likedTracks.includes(id)) {
        user.likedTracks = user.likedTracks.filter(track => track !== id);
    } else {
        user.likedTracks.push(id);
    }

    saveLikedTracks(user.email, user.likedTracks);
    return user.likedTracks.includes(id);
}

function updateFavoritesCount() {
    const counter = document.querySelector("#favoritesCount");
    if (!counter) return;
    counter.textContent = getLikedIds().length;
}

async function ensureCatalogLoaded() {
    if (typeof tracks !== "undefined" && Array.isArray(tracks) && tracks.length > 0) {
        return { tracksList: tracks, artistsList: typeof artists !== "undefined" ? artists : [] };
    }
    try {
        const [tracksRes, artistsRes] = await Promise.all([
            fetch("data/tracks.json"),
            fetch("data/artists.json")
        ]);
        const tracksList = tracksRes.ok ? await tracksRes.json() : [];
        const artistsList = artistsRes.ok ? await artistsRes.json() : [];
        return { tracksList, artistsList };
    } catch {
        return { tracksList: [], artistsList: [] };
    }
}

async function renderLikedTracks() {
    const container = document.querySelector("#favoritesList");
    const summary = document.querySelector("#favoritesSummary");
    if (!container) return;

    container.replaceChildren();

    const user = getCurrentUser();
    if (!user) {
        if (summary) summary.textContent = "";
        const msg = document.createElement("p");
        msg.className = "empty-state";
        msg.textContent = "Please log in to see your liked tracks.";
        container.append(msg);
        updateFavoritesCount();
        return;
    }

    const likedIds = getLikedIds();
    const { tracksList, artistsList } = await ensureCatalogLoaded();

    const likedTracks = likedIds
        .map(id => tracksList.find(track => track.id === id))
        .filter(Boolean);

    if (summary) {
        summary.textContent = likedTracks.length > 0
            ? `Saved tracks: ${likedTracks.length}`
            : "";
    }

    if (likedTracks.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "You haven't liked any tracks yet.";
        container.append(empty);
        updateFavoritesCount();
        return;
    }

    likedTracks.forEach(track => {
        const artist = artistsList.find(item => item.id === track.artistId);

        const item = document.createElement("article");
        item.className = "favorite-track";

        const image = document.createElement("img");
        image.src = track.cover;
        image.alt = track.coverAlt || `${track.title} cover`;

        const info = document.createElement("div");
        info.className = "favorite-track__info";

        const title = document.createElement("h3");
        title.textContent = track.title;

        const artistName = document.createElement("p");
        artistName.textContent = artist ? artist.name : "Unknown artist";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-track__remove";
        removeButton.dataset.removeTrackId = String(track.id);
        removeButton.textContent = "✕";
        removeButton.setAttribute("aria-label", `Remove ${track.title} from favorites`);

        info.append(title, artistName);
        item.append(image, info, removeButton);
        container.append(item);
    });

    updateFavoritesCount();
}

function syncCardLikeButtons() {
    document.querySelectorAll("[data-like-track-id]").forEach(btn => {
        const id = Number(btn.dataset.likeTrackId);
        const liked = isTrackLiked(id);
        btn.textContent = liked ? "♥" : "♡";
        btn.classList.toggle("is-liked", liked);
        btn.setAttribute("aria-pressed", String(liked));
    });
}

function setupFavorites() {
    const tracksGrid = document.querySelector("#tracksGrid");
    const favoritesList = document.querySelector("#favoritesList");
    const favoritesModal = document.querySelector("#favoritesModal");
    const clearBtn = document.querySelector("#clearFavoritesBtn");

    if (tracksGrid) {
        tracksGrid.addEventListener("click", event => {
            const button = event.target.closest("[data-like-track-id]");
            if (!button) return;

            const trackId = Number(button.dataset.likeTrackId);
            const result = toggleTrackLike(trackId);

            if (result === null) {
                alert("Please log in to add tracks to your favorites!");
                return;
            }

            button.textContent = result ? "♥" : "♡";
            button.classList.toggle("is-liked", result);
            button.setAttribute("aria-pressed", String(result));
            updateFavoritesCount();
        });
    }

    if (favoritesList) {
        favoritesList.addEventListener("click", event => {
            const button = event.target.closest("[data-remove-track-id]");
            if (!button) return;

            const trackId = Number(button.dataset.removeTrackId);
            toggleTrackLike(trackId);
            renderLikedTracks();
            syncCardLikeButtons();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const user = getCurrentUser();
            if (!user) {
                alert("Please log in first!");
                return;
            }
            saveLikedTracks(user.email, []);
            renderLikedTracks();
            syncCardLikeButtons();
        });
    }

    if (favoritesModal) {
        favoritesModal.addEventListener("show.bs.modal", renderLikedTracks);
    }

    updateFavoritesCount();
}

document.addEventListener("DOMContentLoaded", setupFavorites);