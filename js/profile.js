const PROFILE_API_URL = "/api/auth/me";

let profileUser = null;

function profileToken() {
    return localStorage.getItem("campusVenueToken");
}

async function loadProfile() {
    try {
        const response = await fetch(
            PROFILE_API_URL,
            {
                headers: {
                    Authorization: `Bearer ${profileToken()}`
                }
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load profile.");
        }

        profileUser = data.user;
        localStorage.setItem(
            "campusVenueUser",
            JSON.stringify(profileUser)
        );
        displayProfile();
        await loadProfileActivity();
    } catch (error) {
        console.error("Profile Load Error:", error);
        showProfileToast(error.message, true);
    }
}

async function loadProfileActivity() {
    const ids = [
        "profileEventsCount",
        "profileUpcomingCount",
        "profileCompletedCount",
        "profileAttendanceCount"
    ];

    try {
        const response = await fetch(
            "/api/registrations/my-events",
            {
                headers: {
                    Authorization: `Bearer ${profileToken()}`
                }
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load activity.");
        }

        const registrations = Array.isArray(data.registrations)
            ? data.registrations.filter(item => item.status === "registered")
            : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let upcoming = 0;
        let completed = 0;
        let attendance = 0;

        registrations.forEach(function (registration) {
            const eventDate = new Date(registration.event?.eventDate);

            if (!Number.isNaN(eventDate.getTime())) {
                eventDate.setHours(0, 0, 0, 0);

                if (eventDate >= today) {
                    upcoming += 1;
                } else {
                    completed += 1;
                }
            }

            if (["present", "absent"].includes(registration.attendanceStatus)) {
                attendance += 1;
            }
        });

        [registrations.length, upcoming, completed, attendance]
            .forEach((value, index) => setProfileText(ids[index], value));
    } catch (error) {
        console.error("Profile Activity Error:", error);
        ids.forEach(id => setProfileText(id, "Unavailable"));
    }
}

function displayProfile() {
    if (!profileUser) {
        return;
    }

    const name = profileUser.name || "Unknown User";
    const collegeId = profileUser.collegeId || "--";
    const email = profileUser.email || "--";

    setProfileText("profileName", name);
    setProfileText("profileEmail", email);
    setProfileText("profileId", `College ID: ${collegeId}`);
    setProfileText("profileAvatar", getProfileInitials(name));
    setProfileText("infoName", name);
    setProfileText("infoId", collegeId);
    setProfileText("infoEmail", email);

    setProfileValue("fullName", name);
    setProfileValue("collegeId", collegeId);
    setProfileValue("email", email);
    setProfileValue("phone", profileUser.phone || "");
    setProfileValue("department", profileUser.department || "");
    setProfileValue("year", profileUser.year || "");
}

function getProfileInitials(name) {
    const words = String(name).trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function setProfileText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setProfileValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.value = value;
    }
}

async function saveProfile(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    const originalText = button ? button.textContent : "";

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
    }

    try {
        const response = await fetch(
            PROFILE_API_URL,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${profileToken()}`
                },
                body: JSON.stringify({
                    name: document.getElementById("fullName").value.trim(),
                    phone: document.getElementById("phone").value.trim(),
                    department: document.getElementById("department").value,
                    year: document.getElementById("year").value
                })
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to update profile.");
        }

        profileUser = data.user;
        localStorage.setItem(
            "campusVenueUser",
            JSON.stringify(profileUser)
        );
        displayProfile();
        showProfileToast(data.message);
    } catch (error) {
        console.error("Profile Update Error:", error);
        showProfileToast(error.message, true);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

function showProfileToast(message, isError) {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.add("show");

    window.setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}

function logout() {
    localStorage.removeItem("campusVenueToken");
    localStorage.removeItem("campusVenueUser");
    localStorage.removeItem("campusVenueRole");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("profileForm");

    if (form) {
        form.addEventListener("submit", saveProfile);
    }

    loadProfile();
});
