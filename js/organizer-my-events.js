const ORGANIZER_API_BASE_URL = "/api";

let allEvents = [];

function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem("campusVenueUser")
        );
    } catch (error) {
        return null;
    }
}

function getOrganizerId() {
    const user = getCurrentUser();

    if (!user) {
        return null;
    }

    return user._id || user.id || user.userId || null;
}

function formatDate(date) {
    if (!date) {
        return "Not specified";
    }

    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime())) {
        return date;
    }

    return eventDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatStatus(status) {
    if (!status) {
        return "Pending";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getBadgeClass(status) {
    if (status === "approved") {
        return "approved";
    }

    if (status === "cancelled") {
        return "cancelled";
    }

    if (status === "rejected") {
        return "rejected";
    }

    return "pending";
}

async function loadEvents() {
    const organizerId = getOrganizerId();

    const grid = document.getElementById("eventGrid");
    const loading = document.getElementById("loading");
    const empty = document.getElementById("empty");

    if (!organizerId) {
        loading.style.display = "none";
        grid.innerHTML = "";
        empty.style.display = "block";
        return;
    }

    loading.style.display = "block";
    empty.style.display = "none";
    grid.innerHTML = "";

    try {
        const token =
            localStorage.getItem("campusVenueToken");

        const response = await fetch(
            `${ORGANIZER_API_BASE_URL}/events/organizer/${organizerId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? {
                              Authorization:
                                  `Bearer ${token}`
                          }
                        : {})
                }
            }
        );

        const data = await response.json();

        console.log(
            "Organizer Events:",
            data
        );

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load events"
            );
        }

        allEvents =
            Array.isArray(data.events)
                ? data.events
                : [];

        renderEvents();

    } catch (error) {
        console.error(
            "Load Organizer Events Error:",
            error
        );

        allEvents = [];

        grid.innerHTML = `
            <div class="empty">
                <h2>Unable to Load Events</h2>
                <p>${error.message}</p>
            </div>
        `;

    } finally {
        loading.style.display = "none";
    }
}

function renderEvents() {
    const grid =
        document.getElementById("eventGrid");

    const search =
        document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();

    const status =
        document.getElementById("status").value;

    grid.innerHTML = "";

    const filteredEvents =
        allEvents.filter(function (event) {

            const title =
                (event.title || "")
                    .toLowerCase();

            const matchesSearch =
                title.includes(search);

            const matchesStatus =
                !status ||
                event.status === status;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    if (filteredEvents.length === 0) {
        document.getElementById("empty").style.display =
            "block";

        return;
    }

    document.getElementById("empty").style.display =
        "none";

    filteredEvents.forEach(function (event) {

        const card =
            document.createElement("div");

        card.className = "event-card";

        const statusText =
            formatStatus(event.status);

        const badgeClass =
            getBadgeClass(event.status);

        const venueName =
            event.venue &&
            event.venue.name
                ? event.venue.name
                : "Not assigned";

        const participants =
            event.expectedParticipants || 0;

        card.innerHTML = `

            <span class="badge ${badgeClass}">
                ${statusText}
            </span>

            <h2>${event.title || "Untitled Event"}</h2>

            <p>
                <strong>Date:</strong>
                ${formatDate(event.eventDate)}
            </p>

            <p>
                <strong>Time:</strong>
                ${event.startTime || "--"} -
                ${event.endTime || "--"}
            </p>

            <p>
                <strong>Venue:</strong>
                ${venueName}
            </p>

            <p>
                <strong>Participants:</strong>
                ${participants}
            </p>

            <div class="actions">

                <button
                    class="btn btn-outline view-event">
                    View
                </button>

                ${
                    event.status === "approved"
                        ? `
                            <button
                                class="btn btn-outline attendance-event">
                                Attendance
                            </button>
                        `
                        : ""
                }

                ${
                    event.status !== "cancelled"
                        ? `
                            <button
                                class="btn btn-outline cancel-event">
                                Cancel
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        const viewButton =
            card.querySelector(
                ".view-event"
            );

        viewButton.addEventListener(
            "click",
            function () {
                viewEvent(event);
            }
        );

        const attendanceButton =
            card.querySelector(
                ".attendance-event"
            );

        if (attendanceButton) {
            attendanceButton.addEventListener(
                "click",
                function () {
                    openAttendance(event);
                }
            );
        }

        const cancelButton =
            card.querySelector(
                ".cancel-event"
            );

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                function () {
                    cancelEvent(
                        event,
                        cancelButton
                    );
                }
            );
        }

        grid.appendChild(card);
    });
}

function filterEvents() {
    renderEvents();
}

function viewEvent(event) {
    localStorage.setItem(
        "organizerSelectedEvent",
        event._id
    );

    window.location.href =
        `event-details.html?id=${event._id}`;
}

function openAttendance(event) {
    window.location.href =
        `attendance.html?eventId=${encodeURIComponent(event._id)}`;
}

async function cancelEvent(
    event,
    button
) {
    const confirmed =
        confirm(
            `Are you sure you want to cancel "${event.title}"?\n\nThis event will be permanently deleted.`
        );

    if (!confirmed) {
        return;
    }

    try {
        button.disabled = true;

        const token =
            localStorage.getItem(
                "campusVenueToken"
            );

        if (!token) {
            alert(
                "Authentication required. Please login again."
            );

            window.location.href =
                "../login.html";

            return;
        }

        const response =
            await fetch(
                `${ORGANIZER_API_BASE_URL}/events/${event._id}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Failed to cancel event"
            );
        }

        allEvents =
            allEvents.filter(
                function (item) {
                    return (
                        item._id !==
                        event._id
                    );
                }
            );

        renderEvents();

        alert(
            "Event cancelled successfully."
        );

    } catch (error) {
        console.error(
            "Cancel Event Error:",
            error
        );

        alert(
            error.message ||
            "Unable to cancel event."
        );

        button.disabled = false;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const search =
            document.getElementById(
                "search"
            );

        const status =
            document.getElementById(
                "status"
            );

        if (search) {
            search.addEventListener(
                "input",
                filterEvents
            );
        }

        if (status) {
            status.addEventListener(
                "change",
                filterEvents
            );
        }

        loadEvents();
    }
);