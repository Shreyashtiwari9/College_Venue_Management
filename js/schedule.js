"use strict";

const EVENTS_API_URL = "/api/events";

let allScheduleEvents = [];

document.addEventListener("DOMContentLoaded", function () {
    loadSchedule();
});

function getScheduleOrganizerId() {
    const user = typeof getCurrentUser === "function"
        ? getCurrentUser()
        : null;

    if (!user) {
        return null;
    }

    return user.id || user._id || null;
}

async function loadSchedule() {
    const schedule = document.getElementById("schedule");
    const venueFilter = document.getElementById("venueFilter");

    if (!schedule) {
        return;
    }

    const organizerId = getScheduleOrganizerId();

    if (!organizerId) {
        schedule.innerHTML = `
            <div class="schedule-empty">
                <div class="schedule-empty-icon">
                    <i class="bi bi-calendar-x"></i>
                </div>
                <h2>Organizer Session Not Found</h2>
                <p>Please login again to view your schedule.</p>
            </div>
        `;

        return;
    }

    schedule.innerHTML = `
        <div class="schedule-loading">
            Loading your event schedule...
        </div>
    `;

    try {
        const response = await fetch(
            `${EVENTS_API_URL}/organizer/${encodeURIComponent(organizerId)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load schedule."
            );
        }

        allScheduleEvents = Array.isArray(data.events)
            ? data.events
            : [];

        populateVenueFilter(allScheduleEvents);

        renderSchedule(allScheduleEvents);

    } catch (error) {
        console.error("Schedule Load Error:", error);

        schedule.innerHTML = `
            <div class="schedule-empty">
                <div class="schedule-empty-icon error">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>

                <h2>Unable to Load Schedule</h2>

                <p>
                    ${escapeScheduleText(error.message)}
                </p>

                <button
                    class="btn btn-primary"
                    type="button"
                    onclick="loadSchedule()"
                >
                    Try Again
                </button>
            </div>
        `;

        if (venueFilter) {
            venueFilter.innerHTML = `
                <option value="">All Venues</option>
            `;
        }
    }
}

function populateVenueFilter(events) {
    const venueFilter = document.getElementById("venueFilter");

    if (!venueFilter) {
        return;
    }

    const venueNames = [];

    events.forEach(function (event) {
        const venueName =
            event.venue && typeof event.venue === "object"
                ? event.venue.name
                : "";

        if (
            venueName &&
            !venueNames.includes(venueName)
        ) {
            venueNames.push(venueName);
        }
    });

    venueNames.sort(function (a, b) {
        return a.localeCompare(b);
    });

    venueFilter.innerHTML = `
        <option value="">All Venues</option>
    `;

    venueNames.forEach(function (venueName) {
        const option = document.createElement("option");

        option.value = venueName;
        option.textContent = venueName;

        venueFilter.appendChild(option);
    });
}

function renderSchedule(events) {
    const schedule = document.getElementById("schedule");

    if (!schedule) {
        return;
    }

    if (!events.length) {
        schedule.innerHTML = `
            <div class="schedule-empty">
                <div class="schedule-empty-icon">
                    <i class="bi bi-calendar-event"></i>
                </div>

                <h2>No Events Found</h2>

                <p>
                    You don't have any events matching the current schedule.
                </p>
            </div>
        `;

        return;
    }

    const sortedEvents = [...events].sort(function (a, b) {
        return new Date(a.eventDate) - new Date(b.eventDate);
    });

    schedule.innerHTML = sortedEvents
        .map(renderScheduleCard)
        .join("");
}

function renderScheduleCard(event) {
    const date = new Date(event.eventDate);

    const day = Number.isNaN(date.getTime())
        ? "--"
        : String(date.getDate()).padStart(2, "0");

    const month = Number.isNaN(date.getTime())
        ? "---"
        : date.toLocaleDateString("en-IN", {
            month: "short"
        }).toUpperCase();

    const year = Number.isNaN(date.getTime())
        ? "----"
        : date.getFullYear();

    const venueName =
        event.venue && typeof event.venue === "object"
            ? event.venue.name
            : "Venue not available";

    const status = event.status || "pending";

    const statusClass =
        String(status)
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `
        <div
            class="schedule-card"
            data-event="${escapeScheduleText(event.title || "")}"
            data-venue="${escapeScheduleText(venueName)}"
        >

            <div class="date-box">
                <div class="day">
                    ${escapeScheduleText(day)}
                </div>

                <div>
                    ${escapeScheduleText(month)}
                    ${escapeScheduleText(year)}
                </div>
            </div>

            <div class="schedule-details">

                <h2>
                    ${escapeScheduleText(event.title)}
                </h2>

                <p>
                    <i class="bi bi-clock"></i>
                    ${formatScheduleTime(event.startTime)}
                    -
                    ${formatScheduleTime(event.endTime)}
                </p>

                <p>
                    <i class="bi bi-geo-alt"></i>
                    ${escapeScheduleText(venueName)}
                </p>

            </div>

            <span class="badge ${escapeScheduleText(statusClass)}">
                ${escapeScheduleText(
                    capitalizeScheduleStatus(status)
                )}
            </span>

        </div>
    `;
}

function filterSchedule() {
    const searchInput =
        document.getElementById("search");

    const venueFilter =
        document.getElementById("venueFilter");

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const venue =
        venueFilter
            ? venueFilter.value.toLowerCase().trim()
            : "";

    const filteredEvents =
        allScheduleEvents.filter(function (event) {

            const title =
                String(event.title || "")
                    .toLowerCase();

            const description =
                String(event.description || "")
                    .toLowerCase();

            const venueName =
                event.venue &&
                typeof event.venue === "object"
                    ? String(event.venue.name || "").toLowerCase()
                    : "";

            const searchMatch =
                !search ||
                title.includes(search) ||
                description.includes(search) ||
                venueName.includes(search);

            const venueMatch =
                !venue ||
                venueName === venue;

            return searchMatch && venueMatch;
        });

    renderSchedule(filteredEvents);
}

function formatScheduleTime(value) {
    if (!value) {
        return "--";
    }

    const parts = String(value).split(":");

    if (parts.length < 2) {
        return value;
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];

    if (
        Number.isNaN(hours) ||
        Number.isNaN(Number(minutes))
    ) {
        return value;
    }

    const period = hours >= 12
        ? "PM"
        : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}

function capitalizeScheduleStatus(status) {
    const text = String(status || "");

    return text.charAt(0).toUpperCase() +
        text.slice(1);
}

function escapeScheduleText(value) {
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