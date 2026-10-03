"use strict";

const EQUIPMENT_API_BASE_URL = "/api";
const EQUIPMENT_REQUEST_API_URL = `${EQUIPMENT_API_BASE_URL}/equipment-requests`;
const EVENTS_API_URL = `${EQUIPMENT_API_BASE_URL}/events`;

function getEquipmentRequestToken() {
    return localStorage.getItem("campusVenueToken");
}

function getOrganizerId() {
    const user = typeof getCurrentUser === "function"
        ? getCurrentUser()
        : null;

    if (!user) {
        return null;
    }

    return user.id || user._id || null;
}

async function loadOrganizerEvents() {
    const eventSelect = document.getElementById("event");
    const eventMessage = document.getElementById("eventMessage");

    if (!eventSelect) {
        return;
    }

    const organizerId = getOrganizerId();

    if (!organizerId) {
        eventSelect.innerHTML = `
            <option value="">Organizer session not found</option>
        `;

        if (eventMessage) {
            eventMessage.textContent = "Please login again.";
        }

        return;
    }

    eventSelect.innerHTML = `
        <option value="">Loading your approved events...</option>
    `;

    try {
        const response = await fetch(
            `${EVENTS_API_URL}/organizer/${encodeURIComponent(organizerId)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getEquipmentRequestToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load events."
            );
        }

        const events = Array.isArray(data.events)
            ? data.events
            : [];

        const approvedEvents = events.filter(function (event) {
            return event.status === "approved";
        });

        eventSelect.innerHTML = `
            <option value="">Select Event</option>
        `;

        if (!approvedEvents.length) {
            eventSelect.innerHTML = `
                <option value="">No approved events available</option>
            `;

            eventSelect.disabled = true;

            if (eventMessage) {
                eventMessage.textContent =
                    "Only approved events can be used for equipment requests.";
            }

            return;
        }

        approvedEvents.forEach(function (event) {
            const option = document.createElement("option");

            option.value = event.title;
            option.textContent = event.title;

            eventSelect.appendChild(option);
        });

        eventSelect.disabled = false;

        if (eventMessage) {
            eventMessage.textContent = "";
        }

    } catch (error) {
        console.error(
            "Load Organizer Events Error:",
            error
        );

        eventSelect.innerHTML = `
            <option value="">Unable to load events</option>
        `;

        eventSelect.disabled = true;

        if (eventMessage) {
            eventMessage.textContent =
                error.message || "Unable to load events.";
        }
    }
}

async function loadRequests() {
    const list = document.getElementById("requestList");

    if (!list) {
        return;
    }

    const token = getEquipmentRequestToken();

    if (!token) {
        list.innerHTML = `
            <div class="empty-request-state">
                <strong>Organizer session not found.</strong>
            </div>
        `;

        return;
    }

    list.innerHTML = `
        <p>Loading equipment requests...</p>
    `;

    try {
        const response = await fetch(
            `${EQUIPMENT_REQUEST_API_URL}/mine`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load requests."
            );
        }

        const requests = Array.isArray(data.requests)
            ? data.requests
            : [];

        if (requests.length === 0) {
            list.innerHTML = `
                <div class="empty-request-state">
                    <strong>No equipment requests yet.</strong>
                    <p>Your submitted equipment requests will appear here.</p>
                </div>
            `;

            return;
        }

        list.innerHTML = requests
            .map(renderRequest)
            .join("");

    } catch (error) {
        console.error(
            "Equipment Request Load Error:",
            error
        );

        list.innerHTML = `
            <div class="empty-request-state">
                <strong>Unable to load requests.</strong>
                <p>${escapeEquipmentText(error.message)}</p>
            </div>
        `;
    }
}

function renderRequest(request) {
    const status = request.status || "Pending";

    const statusClass = status
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `
        <div class="request-card">

            <span class="badge ${escapeEquipmentText(statusClass)}">
                ${escapeEquipmentText(status)}
            </span>

            <h3>
                ${escapeEquipmentText(request.equipment)}
            </h3>

            <p>
                <strong>Event:</strong>
                ${escapeEquipmentText(request.event)}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${escapeEquipmentText(request.quantity)}
            </p>

            <p>
                <strong>Date:</strong>
                ${formatEquipmentDate(request.date)}
            </p>

            <p>
                <strong>Time:</strong>
                ${escapeEquipmentText(request.time)}
            </p>

            ${
                request.notes
                    ? `
                        <p>
                            <strong>Notes:</strong>
                            ${escapeEquipmentText(request.notes)}
                        </p>
                    `
                    : ""
            }

        </div>
    `;
}

async function submitEquipmentRequest(form) {
    const button = document.getElementById(
        "submitEquipmentRequest"
    );

    const token = getEquipmentRequestToken();

    if (!token) {
        window.alert(
            "Your organizer session has expired. Please login again."
        );

        return;
    }

    const event = document.getElementById("event");
    const equipment = document.getElementById("equipment");
    const quantity = document.getElementById("quantity");
    const date = document.getElementById("date");
    const time = document.getElementById("time");
    const notes = document.getElementById("notes");

    if (!event.value) {
        window.alert("Please select an event.");
        event.focus();
        return;
    }

    if (!equipment.value) {
        window.alert("Please select equipment.");
        equipment.focus();
        return;
    }

    if (!quantity.value || Number(quantity.value) < 1) {
        window.alert("Please enter a valid quantity.");
        quantity.focus();
        return;
    }

    if (!date.value) {
        window.alert("Please select required date.");
        date.focus();
        return;
    }

    if (!time.value) {
        window.alert("Please select required time.");
        time.focus();
        return;
    }

    const originalText = button
        ? button.textContent
        : "Submit Equipment Request";

    if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
    }

    try {
        const response = await fetch(
            EQUIPMENT_REQUEST_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    event: event.value,
                    equipment: equipment.value,
                    quantity: quantity.value,
                    date: date.value,
                    time: time.value,
                    notes: notes.value.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to submit request."
            );
        }

        window.alert(data.message);

        form.reset();

        await loadOrganizerEvents();
        await loadRequests();

    } catch (error) {
        console.error(
            "Equipment Request Submit Error:",
            error
        );

        window.alert(
            error.message ||
            "Unable to submit equipment request."
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

function formatEquipmentDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleDateString("en-IN");
}

function escapeEquipmentText(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    window.logoutUser();
}

document.addEventListener(
    "DOMContentLoaded",
    async function () {
        await loadOrganizerEvents();
        await loadRequests();
    }
);

document
    .getElementById("equipmentForm")
    ?.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            await submitEquipmentRequest(
                event.currentTarget
            );
        }
    );