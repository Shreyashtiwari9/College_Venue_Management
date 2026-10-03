const VENUE_REQUEST_API_URL = "/api/venue-requests";

function getVenueRequestToken() {
    return localStorage.getItem("campusVenueToken");
}

async function loadRequests() {
    const box = document.getElementById("requests");
    const count = document.getElementById("requestCount");

    if (!box) {
        return;
    }

    box.innerHTML = "<p>Loading venue requests...</p>";

    try {
        const response = await fetch(
            `${VENUE_REQUEST_API_URL}/mine`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getVenueRequestToken()}`
                }
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load requests.");
        }

        const requests = Array.isArray(data.requests)
            ? data.requests
            : [];

        if (count) {
            count.textContent = `${requests.length} ${requests.length === 1 ? "request" : "requests"}`;
        }

        if (requests.length === 0) {
            box.innerHTML = "<p>No venue requests submitted yet.</p>";
            return;
        }

        box.innerHTML = requests.map(renderRequest).join("");
        setupTiltEffects();
    } catch (error) {
        console.error("Venue Request Load Error:", error);
        box.innerHTML = `<p>${escapeRequestText(error.message)}</p>`;
    }
}

function renderRequest(request) {
    const status = request.status || "Pending";
    const statusClass = status.toLowerCase();

    return `
        <div class="request-card tilt-card">
            <span class="badge ${escapeRequestText(statusClass)}">
                ${escapeRequestText(status)}
            </span>
            <h3>${escapeRequestText(request.event)}</h3>
            <p><strong>Venue:</strong> ${escapeRequestText(request.venue)}</p>
            <p><strong>Date:</strong> ${formatRequestDate(request.date)}</p>
            <p><strong>Time:</strong> ${escapeRequestText(request.start)} - ${escapeRequestText(request.end)}</p>
            <p><strong>Participants:</strong> ${escapeRequestText(request.participants)}</p>
            ${request.purpose
                ? `<p><strong>Purpose:</strong> ${escapeRequestText(request.purpose)}</p>`
                : ""}
        </div>
    `;
}

function setupTiltEffects() {
    document.querySelectorAll(".tilt-card").forEach(function (card) {
        if (card.dataset.tiltReady === "true") {
            return;
        }

        card.dataset.tiltReady = "true";
        card.addEventListener("pointermove", function (event) {
            const rect = card.getBoundingClientRect();
            const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
            const rotateX = (0.5 - (event.clientY - rect.top) / rect.height) * 12;
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });
        card.addEventListener("pointerleave", function () {
            card.style.transform = "";
        });
    });
}

document.getElementById("venueForm")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type=submit]");
    const originalText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
    }

    try {
        const response = await fetch(
            VENUE_REQUEST_API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        `Bearer ${getVenueRequestToken()}`
                },
                body: JSON.stringify({
                    event: document.getElementById("event").value.trim(),
                    venue: document.getElementById("venue").value,
                    participants: document.getElementById("participants").value,
                    date: document.getElementById("date").value,
                    start: document.getElementById("start").value,
                    end: document.getElementById("end").value,
                    purpose: document.getElementById("purpose").value.trim()
                })
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to submit request.");
        }

        window.alert(data.message);
        form.reset();
        await loadRequests();
    } catch (error) {
        console.error("Venue Request Submit Error:", error);
        window.alert(error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
});

function formatRequestDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "--"
        : date.toLocaleDateString("en-IN");
}

function escapeRequestText(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.removeItem("campusVenueToken");
    localStorage.removeItem("campusVenueUser");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", loadRequests);
