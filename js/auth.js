"use strict";

console.log("CampusVenue auth.js loaded");

const API_BASE_URL = window.CAMPUS_VENUE_API_BASE_URL;
const API_AUTH_URL = `${API_BASE_URL}/auth`;

const TOKEN_KEY = "campusVenueToken";
const USER_KEY = "campusVenueUser";
const REMEMBER_KEY = "campusVenueRememberMe";
const ADMIN_EMAIL_KEY = "campusVenueAdminEmail";

const isDarkTheme =
    localStorage.getItem("campusVenueTheme") === "dark";

document.body.classList.toggle("dark", isDarkTheme);
document.body.classList.toggle("dark-mode", isDarkTheme);

function showMessage(elementId, message, type = "error") {
    const element = document.getElementById(elementId);

    if (!element) {
        console.warn(`Message element #${elementId} not found.`);
        return;
    }

    element.textContent = message;
    element.style.display = "block";
    element.className = "";

    if (type === "success") {
        element.classList.add("success-message");
    } else if (type === "warning") {
        element.classList.add("warning-message");
    } else {
        element.classList.add("error-message");
    }
}

function showAccountNotFoundNotification(role = "student") {
    const existingNotification =
        document.getElementById("accountNotFoundNotification");

    if (existingNotification) {
        existingNotification.remove();
    }

    const overlay = document.createElement("div");

    overlay.id = "accountNotFoundNotification";
    overlay.className = "account-not-found-overlay";

    const isStudent = role === "student";

    if (isStudent) {
        overlay.innerHTML = `
            <div class="account-not-found-modal">

                <button
                    type="button"
                    class="account-not-found-close"
                    aria-label="Close notification"
                >
                    <i class="bi bi-x-lg"></i>
                </button>

                <div class="account-not-found-icon">
                    <i class="bi bi-person-plus"></i>
                </div>

                <span class="account-not-found-label">
                    CAMPUSVENUE
                </span>

                <h2>
                    Account Not Found
                </h2>

                <p>
                    We couldn't find a student account with
                    the email or College ID you entered.
                    Please create your student account first.
                </p>

                <div class="account-not-found-actions">

                    <a
                        href="register.html"
                        class="account-register-btn"
                    >
                        Register Now
                        <i class="bi bi-arrow-right"></i>
                    </a>

                    <button
                        type="button"
                        class="account-stay-btn"
                    >
                        Try Again
                    </button>

                </div>

                <div class="account-not-found-progress">
                    <span></span>
                </div>

                <small>
                    Redirecting to student registration...
                </small>

            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div class="account-not-found-modal">

                <button
                    type="button"
                    class="account-not-found-close"
                    aria-label="Close notification"
                >
                    <i class="bi bi-x-lg"></i>
                </button>

                <div class="account-not-found-icon">
                    <i class="bi bi-shield-lock"></i>
                </div>

                <span class="account-not-found-label">
                    CAMPUSVENUE
                </span>

                <h2>
                    Account Not Found
                </h2>

                <p>
                    No ${role} account was found with the
                    email or College ID you entered.
                    ${role === "organizer"
                        ? "Organizer accounts are created by the administrator."
                        : "Admin accounts are created and controlled by the administrator."
                    }
                </p>

                <div class="account-not-found-actions">

                    <button
                        type="button"
                        class="account-stay-btn"
                    >
                        Try Again
                    </button>

                </div>

                <small>
                    Please contact the administrator if you need access.
                </small>

            </div>
        `;
    }

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });

    const closeButton =
        overlay.querySelector(".account-not-found-close");

    const stayButton =
        overlay.querySelector(".account-stay-btn");

    let redirectTimer = null;

    function closeNotification() {
        if (redirectTimer) {
            clearTimeout(redirectTimer);
        }

        overlay.classList.remove("show");

        setTimeout(() => {
            overlay.remove();
        }, 250);
    }

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeNotification
        );
    }

    if (stayButton) {
        stayButton.addEventListener(
            "click",
            closeNotification
        );
    }

    overlay.addEventListener(
        "click",
        function (event) {
            if (event.target === overlay) {
                closeNotification();
            }
        }
    );

    if (isStudent) {
        redirectTimer = setTimeout(() => {
            window.location.href = "register.html";
        }, 2200);
    }
}

async function registerUser(event) {
    if (event) {
        event.preventDefault();
    }

    console.log("registerUser() called");

    const nameElement =
        document.getElementById("fullName");

    const collegeIdElement =
        document.getElementById("collegeId");

    const emailElement =
        document.getElementById("registerEmail");

    const phoneElement =
        document.getElementById("phone");

    const departmentElement =
        document.getElementById("department");

    const yearElement =
        document.getElementById("year");

    const passwordElement =
        document.getElementById("registerPassword");

    const confirmPasswordElement =
        document.getElementById("confirmPassword");

    const name =
        nameElement
            ? nameElement.value.trim()
            : "";

    const collegeId =
        collegeIdElement
            ? collegeIdElement.value.trim()
            : "";

    const email =
        emailElement
            ? emailElement.value.trim().toLowerCase()
            : "";

    const phone =
        phoneElement
            ? phoneElement.value.trim()
            : "";

    const department =
        departmentElement
            ? departmentElement.value
            : "";

    const year =
        yearElement
            ? yearElement.value
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    const confirmPassword =
        confirmPasswordElement
            ? confirmPasswordElement.value
            : "";

    const role = "student";

    if (!name) {
        showMessage(
            "registerMessage",
            "Please enter your full name."
        );
        return;
    }

    if (!collegeId) {
        showMessage(
            "registerMessage",
            "Please enter your College ID."
        );
        return;
    }

    if (!email) {
        showMessage(
            "registerMessage",
            "Please enter your email."
        );
        return;
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage(
            "registerMessage",
            "Please enter a valid email address."
        );
        return;
    }

    if (!phone) {
        showMessage(
            "registerMessage",
            "Please enter your phone number."
        );
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showMessage(
            "registerMessage",
            "Please enter a valid 10 digit phone number."
        );
        return;
    }

    if (!department) {
        showMessage(
            "registerMessage",
            "Please select your department."
        );
        return;
    }

    if (!year) {
        showMessage(
            "registerMessage",
            "Please select your year."
        );
        return;
    }

    if (!password) {
        showMessage(
            "registerMessage",
            "Please enter a password."
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            "registerMessage",
            "Password must be at least 6 characters."
        );
        return;
    }

    if (password !== confirmPassword) {
        showMessage(
            "registerMessage",
            "Passwords do not match."
        );
        return;
    }

    const termsElement =
        document.getElementById("terms");

    if (
        termsElement &&
        !termsElement.checked
    ) {
        showMessage(
            "registerMessage",
            "Please accept the Terms & Conditions."
        );

        return;
    }

    const submitButton =
        document.querySelector(
            '#registerForm button[type="submit"]'
        );

    const originalButtonText =
        submitButton
            ? submitButton.innerHTML
            : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
            "Creating Account...";
    }

    try {
        const response =
            await fetch(
                `${API_AUTH_URL}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        collegeId,
                        email,
                        phone,
                        department,
                        year,
                        password,
                        role
                    })
                }
            );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (
            !response.ok ||
            !data.success
        ) {
            showMessage(
                "registerMessage",
                data.message ||
                "Registration failed. Please try again."
            );

            return;
        }

        showMessage(
            "registerMessage",
            "Student account created successfully! Redirecting to login...",
            "success"
        );

        setTimeout(
            () => {
                window.location.href =
                    "login.html";
            },
            1500
        );

    } catch (error) {
        console.error(
            "Registration error:",
            error
        );

        showMessage(
            "registerMessage",
            "Unable to connect to server. Make sure backend is running."
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;

            submitButton.innerHTML =
                originalButtonText ||
                "Create Student Account";
        }
    }
}

async function loginUser(event) {
    if (event) {
        event.preventDefault();
    }

    console.log("loginUser() called");

    const identifierElement =
        document.getElementById("loginEmail");

    const passwordElement =
        document.getElementById("loginPassword");

    const identifier =
        identifierElement
            ? identifierElement.value.trim()
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    const roleElement =
        document.querySelector(
            'input[name="role"]:checked'
        );

    const selectedRole =
        roleElement
            ? roleElement.value
            : "student";

    if (!identifier) {
        showMessage(
            "loginMessage",
            "Please enter your email or College ID."
        );

        return;
    }

    if (!password) {
        showMessage(
            "loginMessage",
            "Please enter your password."
        );

        return;
    }

    const loginData = {
        password,
        role: selectedRole
    };

    if (identifier.includes("@")) {
        loginData.email =
            identifier.toLowerCase();
    } else {
        loginData.collegeId =
            identifier;
    }

    const loginButton =
        document.getElementById(
            "loginSubmitButton"
        );

    const originalButtonText =
        loginButton
            ? loginButton.innerHTML
            : "";

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML =
            "Signing In...";
    }

    try {
        const response =
            await fetch(
                `${API_AUTH_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            loginData
                        )
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch (error) {
            data = {};
        }

        console.info("[Auth] Login response", {
            origin: new URL(API_AUTH_URL).origin,
            status: response.status,
            code: data.code || null,
            role: selectedRole,
            success: data.success === true
        });

        const accountNotFound =
            response.status === 404 ||
            data.code === "ACCOUNT_NOT_FOUND" ||
            data.error === "ACCOUNT_NOT_FOUND";

        if (accountNotFound) {
            showAccountNotFoundNotification(
                selectedRole
            );

            return;
        }

        if (
            !response.ok ||
            !data.success
        ) {
            showMessage(
                "loginMessage",
                data.message ||
                `Login request failed with HTTP ${response.status}. Check the browser console for safe diagnostics.`
            );

            return;
        }

        const actualRole =
            data.user?.role ||
            selectedRole ||
            "student";

        console.log("LOGIN SUCCESS");

        if (data.token) {
            localStorage.setItem(
                TOKEN_KEY,
                data.token
            );
        }

        if (data.user) {
            localStorage.setItem(
                USER_KEY,
                JSON.stringify(
                    data.user
                )
            );
        }

        localStorage.setItem(
            "campusVenueRole",
            actualRole
        );

        showMessage(
            "loginMessage",
            "Login successful! Redirecting...",
            "success"
        );

        setTimeout(
            () => {
                redirectByRole(
                    actualRole
                );
            },
            800
        );

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        showMessage(
            "loginMessage",
            "Unable to connect to server. Make sure backend is running."
        );

    } finally {
        if (loginButton) {
            loginButton.disabled = false;

            loginButton.innerHTML =
                originalButtonText ||
                "Sign In";
        }
    }
}

function redirectByRole(role) {
    console.log(
        "Redirecting user with role:",
        role
    );

    switch (role) {

        case "student":

            window.location.href =
                "student/dashboard.html";

            break;

        case "organizer":

            window.location.href =
                "organizer/dashboard.html";

            break;

        case "admin":

            window.location.href =
                "admin/dashboard.html";

            break;

        default:

            window.location.href =
                "index.html";

            break;
    }
}

function setupPasswordToggles() {
    const toggleButtons =
        document.querySelectorAll(
            "[data-password-toggle]"
        );

    toggleButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        this.getAttribute(
                            "data-password-toggle"
                        );

                    const passwordInput =
                        document.getElementById(
                            targetId
                        );

                    if (!passwordInput) {
                        return;
                    }

                    if (
                        passwordInput.type ===
                        "password"
                    ) {

                        passwordInput.type =
                            "text";

                        this.innerHTML =
                            '<i class="bi bi-eye-slash"></i>';

                        this.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        passwordInput.type =
                            "password";

                        this.innerHTML =
                            '<i class="bi bi-eye"></i>';

                        this.setAttribute(
                            "aria-label",
                            "Show password"
                        );
                    }
                }
            );
        }
    );
}

function setupPasswordStrength() {
    const passwordInput =
        document.getElementById(
            "registerPassword"
        );

    if (!passwordInput) {
        return;
    }

    passwordInput.addEventListener(
        "input",
        function () {

            const password =
                this.value;

            const strengthElement =
                document.getElementById(
                    "passwordStrength"
                );

            const strengthBar =
                document.querySelector(
                    ".password-strength .strength-bar span"
                );

            if (!strengthElement) {
                return;
            }

            let strength = 0;

            if (password.length >= 6) {
                strength++;
            }

            if (/[A-Z]/.test(password)) {
                strength++;
            }

            if (/[a-z]/.test(password)) {
                strength++;
            }

            if (/[0-9]/.test(password)) {
                strength++;
            }

            if (/[^A-Za-z0-9]/.test(password)) {
                strength++;
            }

            if (!password) {

                strengthElement.textContent =
                    "Password strength";

                if (strengthBar) {
                    strengthBar.style.width =
                        "0%";
                }

            } else if (strength <= 2) {

                strengthElement.textContent =
                    "Weak password";

                if (strengthBar) {
                    strengthBar.style.width =
                        "35%";
                }

            } else if (strength <= 4) {

                strengthElement.textContent =
                    "Medium password";

                if (strengthBar) {
                    strengthBar.style.width =
                        "70%";
                }

            } else {

                strengthElement.textContent =
                    "Strong password";

                if (strengthBar) {
                    strengthBar.style.width =
                        "100%";
                }
            }
        }
    );
}

function getCurrentUser() {
    const userData =
        localStorage.getItem(
            USER_KEY
        );

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(
            userData
        );

    } catch (error) {

        console.error(
            "Invalid stored user data",
            error
        );

        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem(
        TOKEN_KEY
    );
}

function isLoggedIn() {
    const token =
        getAuthToken();

    const user =
        getCurrentUser();

    return !!(
        token &&
        user
    );
}

function getHomePageUrl() {
    const pathSegments =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    pathSegments.pop();

    return new URL(
        `${"../".repeat(pathSegments.length)}index.html`,
        window.location.href
    ).toString();
}

function logoutUser() {
    console.log(
        "Logging out user..."
    );

    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );

    localStorage.removeItem(
        "campusVenueRole"
    );

    localStorage.removeItem(
        REMEMBER_KEY
    );

    window.location.href =
        getHomePageUrl();
}

function logout() {
    logoutUser();
}

function protectPage(requiredRole = null) {
    const token =
        getAuthToken();

    const user =
        getCurrentUser();

    if (
        !token ||
        !user
    ) {

        console.warn(
            "User is not logged in."
        );

        const loginUrl = new URL(
            "../login.html",
            window.location.href
        );

        if (requiredRole) {
            loginUrl.searchParams.set("role", requiredRole);
        }

        window.location.href = loginUrl.toString();

        return false;
    }

    if (
        requiredRole &&
        user.role !== requiredRole
    ) {

        console.warn(
            "Unauthorized role:",
            user.role,
            "Required:",
            requiredRole
        );

        redirectByRole(
            user.role
        );

        return false;
    }

    return true;
}

function updateUserUI() {
    const user =
        getCurrentUser();

    if (!user) {
        return;
    }

    const nameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );

    nameElements.forEach(
        element => {

            element.textContent =
                user.name ||
                "User";
        }
    );

    const emailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );

    emailElements.forEach(
        element => {

            element.textContent =
                user.email ||
                "";
        }
    );

    const roleElements =
        document.querySelectorAll(
            "[data-user-role]"
        );

    roleElements.forEach(
        element => {

            element.textContent =
                user.role ||
                "";
        }
    );
}

function setupLogoutButtons() {
    const logoutButtons =
        document.querySelectorAll(
            "[data-logout]"
        );

    logoutButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    logoutUser();
                }
            );
        }
    );
}

function setupRoleSelector() {
    const roleInputs =
        document.querySelectorAll(
            'input[name="role"]'
        );

    const requestedRole =
        new URLSearchParams(window.location.search).get("role");

    if (["student", "organizer", "admin"].includes(requestedRole)) {
        const requestedInput =
            Array.from(roleInputs).find(
                input => input.value === requestedRole
            );

        if (requestedInput) {
            requestedInput.checked = true;
        }
    }

    function updateActiveRole() {
        roleInputs.forEach(input => {
            input.closest(".role-option")?.classList.toggle(
                "active",
                input.checked
            );
        });
    }

    updateActiveRole();

    roleInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                function () {
                    updateActiveRole();

                    console.log(
                        "Selected login role:",
                        this.value
                    );
                }
            );
        }
    );
}

function setupRegistrationRole() {
    const roleInputs =
        document.querySelectorAll(
            'input[name="registrationRole"]'
        );

    const registerForm =
        document.getElementById("registerForm");

    const organizerForm =
        document.getElementById("organizerRequestForm");

    const organizerType =
        document.getElementById("organizerType");

    const clubField =
        document.getElementById("organizerClubField");

    const clubName =
        document.getElementById("organizerClubName");

    const facultyField =
        document.getElementById("organizerFacultyField");

    const facultyCoordinator =
        document.getElementById("organizerFacultyCoordinator");

    if (
        !roleInputs.length ||
        !registerForm ||
        !organizerForm ||
        !organizerType
    ) {
        return;
    }

    function updateConditionalOrganizerFields() {
        const type = organizerType.value;
        const needsClub = [
            "club-coordinator",
            "student-club-representative"
        ].includes(type);
        const needsFacultyCoordinator =
            type === "student-club-representative";

        clubField.hidden = !needsClub;
        clubName.required = needsClub;
        clubName.disabled = organizerForm.hidden || !needsClub;

        facultyField.hidden = !needsFacultyCoordinator;
        facultyCoordinator.required = needsFacultyCoordinator;
        facultyCoordinator.disabled = organizerForm.hidden || !needsFacultyCoordinator;
    }

    function updateRegistrationView() {
        const isStudent =
            document.querySelector(
                'input[name="registrationRole"]:checked'
            )?.value === "student";

        registerForm.hidden = !isStudent;
    organizerForm.hidden = isStudent;

        registerForm
            .querySelectorAll("input, select, textarea, button")
            .forEach(control => {
                control.disabled = !isStudent;
            });

        organizerForm
            .querySelectorAll("input, select, textarea, button")
            .forEach(control => {
                control.disabled = isStudent;
            });

        updateConditionalOrganizerFields();

        roleInputs.forEach(input => {
            input.closest(".role-option")?.classList.toggle(
                "active",
                input.checked
            );
        });
    }

    roleInputs.forEach(input => {
        input.addEventListener("change", updateRegistrationView);
    });

    organizerType.addEventListener(
        "change",
        updateConditionalOrganizerFields
    );

    organizerForm.addEventListener(
        "submit",
        registerOrganizerRequest
    );

    updateRegistrationView();
}

async function registerOrganizerRequest(event) {
    event.preventDefault();

    const form = document.getElementById("organizerRequestForm");
    const password = document.getElementById("organizerPassword");
    const confirmPassword = document.getElementById("organizerConfirmPassword");
    const phone = document.getElementById("organizerPhone");

    const phoneDigits = phone.value.replace(/\D/g, "");
    const validPhone =
        /^\+?[\d\s().-]+$/.test(phone.value.trim()) &&
        phoneDigits.length >= 7 &&
        phoneDigits.length <= 15;

    phone.setCustomValidity(
        validPhone ? "" : "Please enter a valid contact number."
    );

    confirmPassword.setCustomValidity(
        confirmPassword.value === password.value
            ? ""
            : "Passwords do not match."
    );

    if (!form.reportValidity()) {
        return;
    }

    const submitButton =
        document.getElementById("organizerRegisterSubmit");
    const originalButtonText = submitButton.innerHTML;
    const payload = {
        name: document.getElementById("organizerName").value.trim(),
        collegeId: document.getElementById("organizerCollegeId").value.trim(),
        email: document.getElementById("organizerEmail").value.trim().toLowerCase(),
        phone: document.getElementById("organizerPhone").value.trim(),
        department: document.getElementById("organizerDepartment").value.trim(),
        designation: document.getElementById("organizerDesignation").value.trim(),
        organizerType: document.getElementById("organizerType").value,
        clubName: document.getElementById("organizerClubName").value.trim(),
        facultyCoordinatorName: document.getElementById("organizerFacultyCoordinator").value.trim(),
        responsibilityDescription: document.getElementById("organizerResponsibilities").value.trim(),
        accessRequestReason: document.getElementById("organizerReason").value.trim(),
        termsAccepted: document.getElementById("organizerTermsAccepted").checked,
        password: password.value
    };

    submitButton.disabled = true;
    submitButton.innerHTML = "Submitting Request...";

    try {
        const response = await fetch(
            `${API_AUTH_URL}/register-organizer`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            showMessage(
                "organizerRegisterMessage",
                data.message || "Unable to submit your organizer request."
            );
            return;
        }

        form.reset();
        document.getElementById("organizerType").dispatchEvent(
            new Event("change")
        );
        showMessage(
            "organizerRegisterMessage",
            data.message || "Organizer request submitted for Admin approval.",
            "success"
        );
    } catch (error) {
        console.error("Organizer Request Error:", error);
        showMessage(
            "organizerRegisterMessage",
            "Unable to connect to the server. Please try again."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

function setupRememberMe() {
    const rememberCheckbox =
        document.getElementById(
            "rememberMe"
        );

    if (!rememberCheckbox) {
        return;
    }

    const savedPreference =
        localStorage.getItem(
            REMEMBER_KEY
        );

    if (
        savedPreference ===
        "true"
    ) {

        rememberCheckbox.checked =
            true;
    }

    rememberCheckbox.addEventListener(
        "change",
        function () {

            if (this.checked) {

                localStorage.setItem(
                    REMEMBER_KEY,
                    "true"
                );

            } else {

                localStorage.removeItem(
                    REMEMBER_KEY
                );
            }
        }
    );
}

function setupGoogleLogin() {
    const googleButton =
        document.getElementById(
            "googleLogin"
        );

    if (!googleButton) {
        return;
    }

    googleButton.addEventListener(
        "click",
        function () {

            showMessage(
                "loginMessage",
                "Google login will be available soon.",
                "warning"
            );
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "DOM loaded - initializing authentication..."
        );

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                loginUser
            );
        }

        const registerForm =
            document.getElementById(
                "registerForm"
            );

        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                registerUser
            );
        }

        setupPasswordToggles();
        setupPasswordStrength();
        setupRoleSelector();
        setupRegistrationRole();
        setupRememberMe();
        setupGoogleLogin();
        setupLogoutButtons();
        updateUserUI();

        console.log(
            "CampusVenue authentication initialized"
        );
    }
);

window.loginUser =
    loginUser;

window.registerUser =
    registerUser;

window.logoutUser =
    logoutUser;

window.logout =
    logout;

window.getCurrentUser =
    getCurrentUser;

window.getAuthToken =
    getAuthToken;

window.isLoggedIn =
    isLoggedIn;

window.protectPage =
    protectPage;

window.redirectByRole =
    redirectByRole;

window.updateUserUI =
    updateUserUI;
