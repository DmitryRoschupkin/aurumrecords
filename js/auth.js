const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NICK_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const NAME_RE = /^[\p{L}'-]+(\s+[\p{L}'-]+)+$/u;

const validators =  {
    fullname(value) {
        if (!value) return "Please, enter your full name.";
        if (!NAME_RE.test(value)) return "Enter first and last name, letters only.";
        return "";
    },
    nickname(value) {
        if (!value) return "Please, enter a nickname.";
        if (!NICK_RE.test(value)) return "3-20 characters: latin letters, digits, _ or .";
        return "";
    },
    email(value) {
        if (!value) return "Please, enter an email.";
        if (!EMAIL_RE.test(value)) return "Enter a valid email, e.g. name@example.com.";
        return "";
    },
    password(value) {
        if (!value) return "Enter your password.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
            return "Password must contain at least one letter and one digit.";
        }
        return "";
    },
    passwordConfirm(value, form) {
        if (!value) return "Confirm your password.";
        if (value !== form.elements.password.value) return "Passwords do not match.";
        return "";
    }
};

const loginValidators = {
    email: validators.email,
    password(value) {
        return value ? "" : "Enter your password.";
    }
};

function getErrorBox(input) {
    let box = document.getElementById(`${input.id}-error`);
    if (!box) {
        box = document.createElement("div");
        box.id = `${input.id}-error`;
        box.className = "invalid-feedback";
        input.insertAdjacentElement("afterend", box);
    }
    box.setAttribute("role", "alert");
    input.setAttribute("aria-describedby", box.id);
    return box;
}

function showError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", true);
    getErrorBox(input).textContent = message;
}
const regForm = document.querySelector(".auth-form.reg form, .auth-form form");
const fullnameInput = document.getElementById("fullname");


function clearError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    getErrorBox(input).textContent = "";
}

function clearAllErrors(form) {
    form.querySelectorAll(".form-control").forEach(clearError);
}

function showStatus(message, type) {
    const status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message;
    status.className = `form-status form-status--${type}`;
}

function validateField(input, form, rules) {
    const rule = rules[input.id];
    if (!rule) return true;
    const value = input.id.startsWith("password") ? input.value : input.value.trim();
    const message = rule(value, form);
    if (message) {
        showError(input, message);
        return false;
    }
    clearError(input);
    return true;
}

function validateForm(form, rules) {
    let firstInvalid = null;
    Object.keys(rules).forEach(id => {
        const input = form.elements[id];
        if (!validateField(input, form, rules) && !firstInvalid) {
            firstInvalid = input;
        }
    });

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
}

function attachLiveValidation(form, rules) {
    Object.keys(rules).forEach(id => {
        const input = form.elements[id];
        input.addEventListener("input", () => {
            if (input.classList.contains("is-invalid")) {
                validateField(input, form, rules);
            }

            if (id === "password" && form.elements.passwordConfirm?.classList.contains("is-invalid")) {
                validateField(form.elements.passwordConfirm, form, rules);
            }
        });
    })
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem("users")) || [];

        return users.map(user => ({
            ...user,
            likedTracks: Array.isArray(user.likedTracks)
                ? user.likedTracks
                : []
        }));
    } catch {
        return [];
    }
}

function initRegistration(form) {
    attachLiveValidation(form, validators);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        showStatus("", "");

        if (!validateForm(form, validators)) return;

        const email = form.elements.email.value.trim().toLowerCase();
        const users = getUsers();

        if (users.some(u => u.email === email)) {
            showError(form.elements.email, "This email is already registered.");
            form.elements.email.focus();
            return;
        }

        users.push({
            fullname: form.elements.fullname.value.trim(),
            nickname: form.elements.nickname.value.trim(),
            email,
            password: form.elements.password.value,
            likedTracks: []
        });

        localStorage.setItem("users", JSON.stringify(users));

        form.reset();
        clearAllErrors(form);
        showStatus("Account created! Redirecting to login...", "success");
        form.querySelector("button[type=submit]").disabled = true;
        setTimeout(() => {window.location.href = "login.html";}, 1500);
    });
}

function initLogin(form) {
    attachLiveValidation(form, loginValidators);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        showStatus("", "");
        if (!validateForm(form, loginValidators)) return;

        const email = form.elements.email.value.trim().toLowerCase();
        const password = form.elements.password.value;
        const user = getUsers().find(u => u.email === email && u.password === password);

        if (!user) {
            showError(form.elements.email, "Incorrect email or password.");
            showError(form.elements.password, "Incorrect email or password.");
            form.elements.email.focus();
            return;
        }

        localStorage.setItem("current_user", JSON.stringify(user));
        form.reset();
        clearAllErrors(form);
        showStatus(`Welcome, ${user.nickname}! Redirecting...`, "success");
        form.querySelector("button[type=submit]").disabled = true;
        setTimeout(() => { window.location.href = "index.html"; }, 1000);

    });
}

const authForm = document.querySelector(".auth-form form");
if (authForm) {
    if (authForm.elements.fullname) initRegistration(authForm);
    else initLogin(authForm);
}