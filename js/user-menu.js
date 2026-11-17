"use strict";

function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem("current_user"));

        return user && typeof user === "object" ? user : null;
    } catch {
        return null;
    }
}

function createUserProfileModal() {
    if (document.querySelector("#userProfileModal")) {
        return;
    }

    const modal = document.createElement("div");

    modal.className = "modal fade user-profile-modal";
    modal.id = "userProfileModal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-labelledby", "userProfileTitle");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="userProfileTitle">
                        Your Profile
                    </h2>
              
                    <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                    >
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="profile-detail">
                        <span class="profile-detail__label">Full Name</span>
                        <p id="profileFullname"></p>
                    </div>
                    <div class="profile-detail">
                        <span class="profile-detail__label">Nickname</span>
                        <p id="profileNickname"></p>
                    </div>
                    <div class="profile-detail">
                        <span class="profile-detail__label">Email</span>
                        <p id="profileEmail"></p>
                    </div>
                    <div class="profile-detail">
                        <span class="profile-detail__label">Liked tracks</span>
                        <p id="profileLikedTracks">0</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn profile-logout-btn"
                        id="logoutButton">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.append(modal);
    document.querySelector("#logoutButton").addEventListener("click", logout);
}

function updateProfileModal() {
    const user = getCurrentUser();

    if (!user) return;

    document.querySelector("#profileFullname").textContent =
        user.fullname || "Not provided";

    document.querySelector("#profileNickname").textContent =
        user.nickname || "Not provided";

    document.querySelector("#profileEmail").textContent =
        user.email || "Not provided";

    document.querySelector("#profileLikedTracks").textContent =
        Array.isArray(user.likedTracks) ? user.likedTracks.length : 0;
}

function updateNavbarUser() {
    const loginLink = document.querySelector(
        ".navbar .user-menu-trigger, .navbar a[href$='login.html']"
    );

    if (!loginLink) return;

    loginLink.classList.add("user-menu-trigger");

    const user = getCurrentUser();

    if (!user) {
        if (loginLink.dataset.originalHref) {
            loginLink.href = loginLink.dataset.originalHref;
            loginLink.textContent = "Login";

            delete loginLink.dataset.originalHref;
        }

        loginLink.removeAttribute("data-bs-toggle");
        loginLink.removeAttribute("data-bs-target");
        loginLink.removeAttribute("aria-controls");

        return;
    }

    if (!loginLink.dataset.originalHref) {
        loginLink.dataset.originalHref = loginLink.getAttribute("href");
    }

    loginLink.textContent = user.nickname || user.fullname || "My account";
    loginLink.href = "#userProfileModal";

    loginLink.setAttribute("data-bs-toggle", "modal");
    loginLink.setAttribute("data-bs-target", "#userProfileModal");
    loginLink.setAttribute("aria-controls", "userProfileModal");
    loginLink.setAttribute("aria-label", "Open your account");

    updateProfileModal();
}

function logout() {
    localStorage.removeItem("current_user");

    const modalElement = document.querySelector("#userProfileModal");

    if (modalElement && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }
    }

    updateNavbarUser();
}

document.addEventListener("DOMContentLoaded", () => {
    createUserProfileModal();
    updateNavbarUser();

    const modal = document.querySelector("#userProfileModal");

    modal.addEventListener("show.bs.modal", updateProfileModal);

    window.addEventListener("storage", event => {
        if (event.key === "current_user") {
            updateNavbarUser();
        }
    });
});