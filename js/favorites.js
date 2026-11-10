"use strict";

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("current_user"));
    } catch {
        return null;
    }
}

function isTrackLiked(trackId) {
    const user = getCurrentUser();

    if (!user || !Array.isArray(user.likedTracks)) {
        return false;
    }

    return user.likedTracks.includes(Number(trackId));
}

function saveLikedTracks(email, likedTracks) {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const userIndex = users.findIndex(
        user => user.email === email
    );

    if (userIndex === -1) return false;

    users[userIndex].likedTracks = likedTracks;

    localStorage.setItem("users", JSON.stringify(users));

    localStorage.setItem(
        "current_user",
        JSON.stringify(users[userIndex])
    );

    return true;
}

function toggleTrackLike(trackId) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
        item => item.email === currentUser.email
    );

    if (!user) return null;

    if (!Array.isArray(user.likedTracks)) {
        user.likedTracks = [];
    }

    const id = Number(trackId);

    if (user.likedTracks.includes(id)) {
        user.likedTracks = user.likedTracks.filter(
            track => track !== id
        );
    } else {
        user.likedTracks.push(id);
    }

    return saveLikedTracks(user.email, user.likedTracks);
}

function updateFavoritesCount() {
    const counter = document.querySelector("#favoritesCount");
    if (!counter) return;

    const user = getCurrentUser();
    const count = user?.likedTracks?.length || 0;

    counter.textContent = count;
}

function renderLikedTracks() {
    const container = document.querySelector("#favoritesList");
    if (!container) return;

    container.replaceChildren();

    const user = getCurrentUser();

    if (!user) {
        container.textContent = "Please log in to see your liked tracks.";
        updateFavoritesCount();
        return;
    }

    const likedTracks = (user.likedTracks || [])
        .map(id => tracks.find(track => track.id === id))
        .filter(Boolean);

    if (likedTracks.length === 0) {
        container.textContent = "You haven't liked any tracks yet.";
        updateFavoritesCount();
        return;
    }

    likedTracks.forEach(track => {
        const artist = artists.find(
            item => item.id === track.artistId
        );

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
        removeButton.dataset.removeTrackId = track.id;
        removeButton.textContent = "♥";
        removeButton.setAttribute(
            "aria-label",
            `Remove ${track.title} from favorites`
        );

        info.append(title, artistName);
        item.append(image, info, removeButton);
        container.append(item);
    });

    updateFavoritesCount();
}

function setupFavorites() {
    const tracksGrid = document.querySelector("#tracksGrid");
    const favoritesList = document.querySelector("#favoritesList");
    const favoritesModal = document.querySelector("#favoritesModal");

    if (tracksGrid) {
        tracksGrid.addEventListener("click", event => {
            const button = event.target.closest("[data-like-track-id]");

            if (!button) return;

            const trackId = Number(button.dataset.likeTrackId);
            const result = toggleTrackLike(trackId);

            if (result === null) {
                const status = document.querySelector("#tracksStatus");

                if (status) {
                    status.textContent =
                        "Please log in to add tracks to your favorites.";
                }

                return;
            }

            const liked = isTrackLiked(trackId);

            button.textContent = liked ? "♥" : "♡";
            button.classList.toggle("is-liked", liked);
            button.setAttribute("aria-pressed", String(liked));

            const track = tracks.find(item => item.id === trackId);

            if (track) {
                button.setAttribute(
                    "aria-label",
                    `${liked ? "Remove" : "Add"} ${track.title} ${liked ? "from" : "to"} favorites`
                );
            }

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

            const trackButton = document.querySelector(
                `[data-like-track-id="${trackId}"]`
            );

            if (trackButton) {
                trackButton.textContent = "♡";
                trackButton.classList.remove("is-liked");
                trackButton.setAttribute("aria-pressed", "false");
            }
        });
    }

    if (favoritesModal) {
        favoritesModal.addEventListener("show.bs.modal", renderLikedTracks);
    }

    updateFavoritesCount();
}
