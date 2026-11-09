const regForm = document.querySelector(".auth-form.reg form, .auth-form form");
const fullnameInput = document.getElementById("fullname");

function showError(inputElement, message) {
    inputElement.classList.add("is-invalid");
    const errorDiv = document.getElementById(`${inputElement.id}-error`);
    if (errorDiv) {
        errorDiv.textContent = message;
    }
}

function clearErrors(form) {
    const inputs = form.querySelectorAll(".form-control");
    inputs.forEach(input => {
        input.classList.remove("is-invalid");
        const errorDiv = document.getElementById(`${input.id}-error`);
        if (errorDiv) {
            errorDiv.textContent = "";
        }
    });
}

if (fullnameInput) {
    regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearErrors(regForm);

        const nicknameInput = document.getElementById("nickname");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const passwordConfirmInput = document.getElementById("passwordConfirm");

        let isValid = true;

        const fullname = fullnameInput.value.trim();
        const nickname = nicknameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (!fullname) {
            showError(fullnameInput, "Please, enter a fullname");
            isValid = false;
        }

        if (!nickname) {
            showError(nicknameInput, "Please, enter a nickname");
            isValid = false;
        }

        if (!email) {
            showError(emailInput, "Please, enter an email.");
            isValid = false;
        } else if (!email.includes("@")) {
            showError(emailInput, "Please, enter a valid email (must include @).");
            isValid = false;
        }

        if (!password) {
            showError(passwordInput, "Enter your password.");
            isValid = false;
        } else if (password.length < 6) {
            showError(passwordInput, "Password must be at least 6 characters.");
            isValid = false;
        }

        if (!passwordConfirm) {
            showError(passwordConfirmInput, "Confirm your password.");
            isValid = false;
        } else if (password !== passwordConfirm) {
            showError(passwordConfirmInput, "Passwords do not match.");
            isValid = false;
        }

        if (!isValid) return;

        let users = JSON.parse(localStorage.getItem("users")) || [];
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            alert("User already exists!");
            return;
        }

        const newUser = {
            fullname, nickname, email, password
        };

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        alert("Successfully logged in!");
        window.location.href = "login.html";
    });
} else {
    const loginForm = document.querySelector(".auth-form form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            clearErrors(loginForm);

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            let isValid = true;
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                showError(emailInput, "Enter an email.");
                isValid = false;
            }

            if (!password) {
                showError(passwordInput, "Enter your password.");
                isValid = false;
            }

            if (!isValid) return;

            const users = JSON.parse(localStorage.getItem("users")) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem("current_user", JSON.stringify(user));
                alert(`Welcome, ${ user.nickname }!`);
                window.location.href = "index.html";
            } else {
                showError(emailInput, "Incorrect email or password.");
                showError(passwordInput, "Incorrect email or password.");
            }
        });
    }
}