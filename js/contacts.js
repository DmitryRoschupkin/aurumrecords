$(document).ready(function () {

    const releaseDateInput = $("#releaseDate");

    const minReleaseDate = new Date();
    minReleaseDate.setDate(minReleaseDate.getDate() + 14);

    const minDateString = [
        minReleaseDate.getFullYear(),
        String(minReleaseDate.getMonth() + 1).padStart(2, "0"),
        String(minReleaseDate.getDate()).padStart(2, "0")
    ].join("-");

    releaseDateInput.attr("min", minDateString);


    function showError($field, message) {
        $field.addClass("is-invalid");

        let $error = $field.siblings(".field-error");

        if ($error.length === 0) {
            $error = $("<small>").addClass("field-error");
            $field.after($error);
        }

        $error.text(message);
    }


    function clearError($field) {
        $field.removeClass("is-invalid");
        $field.siblings(".field-error").remove();
    }


    function showSuccess($form, message) {
        let $success = $form.find(".form-success");

        if ($success.length === 0) {
            $success = $("<p>")
                .addClass("form-success")
                .attr("role", "status")
                .prependTo($form);
        }

        $success.text(message).hide().fadeIn(300);
    }


    function isValidUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "https:" || url.protocol === "http:";
        } catch {
            return false;
        }
    }


    function validateText($field, fieldName, minLength, maxLength) {
        const value = $field.val().trim();

        if (value.length === 0) {
            showError($field, `${fieldName} is required.`);
            return false;
        }

        if (value.length < minLength) {
            showError($field, `${fieldName} must contain at least ${minLength} characters.`);
            return false;
        }

        if (value.length > maxLength) {
            showError($field, `${fieldName} must not exceed ${maxLength} characters.`);
            return false;
        }

        clearError($field);
        return true;
    }


    function validateUrl($field, fieldName) {
        const value = $field.val().trim();

        if (value.length === 0) {
            showError($field, `${fieldName} is required.`);
            return false;
        }

        if (!isValidUrl(value)) {
            showError($field, `Please enter a valid HTTP or HTTPS link.`);
            return false;
        }

        clearError($field);
        return true;
    }


    function validateReleaseDate() {
        const $field = $("#releaseDate");
        const value = $field.val();

        if (!value) {
            showError($field, "Please select a release date.");
            return false;
        }

        if (value < minDateString) {
            showError($field, "The release date must be at least 14 days from today.");
            return false;
        }

        clearError($field);
        return true;
    }


    function validateCover() {
        const $field = $("#coverFile");
        const file = $field[0].files[0];

        if (!file) {
            clearError($field);
            return true;
        }

        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 10 * 1024 * 1024; // 10 MB

        if (!allowedTypes.includes(file.type)) {
            showError($field, "Only JPG and PNG files are allowed.");
            return false;
        }

        if (file.size > maxSize) {
            showError($field, "The cover artwork must not exceed 10 MB.");
            return false;
        }

        clearError($field);
        return true;
    }


    function validateCheckbox($field, message) {
        if (!$field.is(":checked")) {
            showError($field, message);
            return false;
        }

        clearError($field);
        return true;
    }


    $("#distroForm").on("submit", function (event) {
        event.preventDefault();

        const isValid = [
            validateText($("#artistName"), "Artist name", 2, 40),
            validateText($("#trackTitle"), "Track title", 2, 60),
            $("#genreSelect").val() !== "",
            $("#tariffSelect").val() !== "",
            validateReleaseDate(),
            validateUrl($("#audioLink"), "Audio link"),
            validateCover(),
            validateCheckbox(
                $("#termsCheck"),
                "You must confirm that you own the necessary rights."
            )
        ].every(Boolean);

        if (!$("#genreSelect").val()) {
            showError($("#genreSelect"), "Please select a genre.");
        } else {
            clearError($("#genreSelect"));
        }

        if (!$("#tariffSelect").val()) {
            showError($("#tariffSelect"), "Please select a package.");
        } else {
            clearError($("#tariffSelect"));
        }

        if (!isValid) {
            return;
        }

        showSuccess(
            $(this),
            "Your release submission has been completed successfully!"
        );

        this.reset();
        releaseDateInput.attr("min", minDateString);

        $(this).find(".is-invalid").removeClass("is-invalid");
        $(this).find(".field-error").remove();
    });


    $("#joinForm").on("submit", function (event) {
        event.preventDefault();

        const $contact = $("#contactInfo");
        const contactValue = $contact.val().trim();

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue);
        const isPhone = /^\+?[0-9\s()-]{7,20}$/.test(contactValue);
        const isTelegram = /^@[a-zA-Z0-9_]{5,32}$/.test(contactValue);

        let contactValid = isEmail || isPhone || isTelegram;

        if (!contactValue) {
            showError($contact, "Contact details are required.");
            contactValid = false;
        } else if (!contactValid) {
            showError($contact, "Enter a valid email, phone number, or Telegram username.");
        } else {
            clearError($contact);
        }

        const isValid = [
            validateText($("#artistAlias"), "Artist name", 2, 40),
            contactValid,
            validateUrl($("#portfolioLink"), "Portfolio link"),
            validateText($("#artistBio"), "Musical background", 30, 1000),
            validateCheckbox(
                $("#joinConsent"),
                "You must agree to the processing of your personal data."
            )
        ].every(Boolean);

        if (!isValid) {
            return;
        }

        showSuccess(
            $(this),
            "Your artist application has been submitted successfully!"
        );

        this.reset();

        $(this).find(".is-invalid").removeClass("is-invalid");
        $(this).find(".field-error").remove();
    });


    $("input, textarea, select").on("input change", function () {
        clearError($(this));
    });

});