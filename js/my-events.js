const MY_EVENTS_API_URL = "/api";

const isStudentMyEventsPage =
    !!document.getElementById("eventsList");

const isOrganizerMyEventsPage =
    !!document.getElementById("eventGrid");

let studentRegistrations = [];
let studentAttendance = [];
let studentAttendanceAvailable = true;
let studentActiveFilter = "all";
let approvedEvents = [];

let organizerEvents = [];

function getLoggedInUser() {
    try {
        const userData =
            localStorage.getItem("campusVenueUser");

        if (!userData) return null;

        return JSON.parse(userData);

    } catch (error) {
        console.error("User data error:", error);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem("campusVenueToken");
}

document.addEventListener("DOMContentLoaded", function () {

    if (isStudentMyEventsPage) {
        initializeStudentMyEvents();
    }

    if (isOrganizerMyEventsPage) {
        initializeOrganizerMyEvents();
    }

});

function initializeStudentMyEvents() {

    const token = getAuthToken();

    if (!token) {
        showStudentError("Please login first.");
        return;
    }

    setupStudentTabs();

    loadApprovedEvents();

    loadStudentMyEvents();
}


async function loadApprovedEvents() {

    try {

        const response =
            await fetch(`${MY_EVENTS_API_URL}/events`);

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load approved events."
            );
        }

        approvedEvents =
            Array.isArray(data.events)
                ? data.events.filter(function (event) {
                    const eventDate = new Date(event.eventDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    return (
                        String(event.status).toLowerCase() === "approved" &&
                        !Number.isNaN(eventDate.getTime()) &&
                        eventDate >= today
                    );
                })
                : [];

        renderApprovedEvents();

    } catch (error) {

        console.error("Approved Events Error:", error);

    }

}

function renderApprovedEvents() {

    const list =
        document.getElementById("approvedEventsList");

    if (!list) {
        return;
    }

    if (approvedEvents.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No Approved Events</h3>
                <p>New approved events will appear here.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = approvedEvents.map(function (event) {

        const venue = event.venue || {};
        const eventDate = new Date(event.eventDate);
        const month = Number.isNaN(eventDate.getTime())
            ? "---"
            : eventDate.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
        const day = Number.isNaN(eventDate.getTime())
            ? "--"
            : eventDate.getDate();

        return `
            <article class="my-event-card approved-event-card">
                <div class="event-date" aria-label="Event date">
                    <span class="month">${escapeHTML(month)}</span>
                    <span class="day">${escapeHTML(day)}</span>
                </div>
                <div class="event-content">
                    <h3>${escapeHTML(event.title || "Untitled Event")}</h3>
                    <p>${escapeHTML(event.description || "No description available.")}</p>
                    <div class="event-meta">
                        <span><i class="bi bi-calendar-event"></i> ${escapeHTML(formatDate(event.eventDate))}</span>
                        <span><i class="bi bi-geo-alt"></i> ${escapeHTML(venue.name || "Venue not assigned")}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <span class="status approved">Approved</span>
                    <div class="action-buttons">
                        <button class="details-btn" type="button" onclick="viewStudentEvent('${event._id}')">Details</button>
                        <button class="join-btn" type="button" onclick="registerApprovedEvent('${event._id}')">Join Event</button>
                    </div>
                </div>
            </article>
        `;

    }).join("");

}

function registerApprovedEvent(eventId) {

    if (!eventId) {
        return;
    }

    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;

}
async function loadStudentMyEvents() {

    const loading =
        document.getElementById("eventsLoading");

    const errorBox =
        document.getElementById("eventsError");

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    try {

        const token = getAuthToken();

        if (!token) {
            throw new Error(
                "Authentication required. Please login again."
            );
        }

        const registrationResponse = await fetch(
            `${MY_EVENTS_API_URL}/registrations/my-events`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const registrationData =
            await registrationResponse.json();

        console.log(
            "Student My Events Response:",
            registrationData
        );

        if (
            registrationResponse.status === 401
        ) {
            handleStudentUnauthorized();
            return;
        }

        if (
            !registrationResponse.ok ||
            !registrationData.success
        ) {
            throw new Error(
                registrationData.message ||
                "Failed to load your events."
            );
        }

        studentRegistrations =
            Array.isArray(
                registrationData.registrations
            )
                ? registrationData.registrations
                : [];

        await loadStudentAttendance();

        updateStudentStats();

        renderStudentEvents();

    } catch (error) {

        console.error(
            "Student My Events Error:",
            error
        );

        showStudentError(
            error.message ||
            "Unable to load your events."
        );

    } finally {

        if (loading) {
            loading.style.display = "none";
        }

    }
}

async function loadStudentAttendance() {

    const token = getAuthToken();

    if (!token) {
        handleStudentUnauthorized();
        return;
    }

    try {

        const response = await fetch(
            `${MY_EVENTS_API_URL}/attendance/my`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data =
            await response.json();

        console.log(
            "Student Attendance Response:",
            data
        );

        if (response.status === 401) {
            handleStudentUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load attendance."
            );
        }

        studentAttendance =
            Array.isArray(data.events)
                ? data.events
                : [];
        studentAttendanceAvailable = true;

        mergeAttendanceWithRegistrations();

    } catch (error) {

        console.error(
            "Student Attendance Error:",
            error
        );

        studentAttendance = [];
        studentAttendanceAvailable = false;

        mergeAttendanceWithRegistrations();
    }
}

function mergeAttendanceWithRegistrations() {

    studentRegistrations =
        studentRegistrations.map(
            function (registration) {

                const event =
                    getRegistrationEvent(
                        registration
                    );

                if (!event) {
                    return {
                        ...registration,
                        attendanceStatus: "not-marked"
                    };
                }

                const attendanceRecord =
                    studentAttendance.find(
                        function (attendance) {

                            return String(
                                attendance.eventId
                            ) === String(
                                event._id
                            );

                        }
                    );

                return {
                    ...registration,
                    attendanceStatus:
                        attendanceRecord
                            ? attendanceRecord.attendanceStatus || "not-marked"
                            : "not-marked"
                };

            }
        );

}

function setupStudentTabs() {

    const tabs =
        document.querySelectorAll(".tab-btn");

    tabs.forEach(function (tab) {

        tab.addEventListener(
            "click",
            function () {

                tabs.forEach(function (item) {
                    item.classList.remove("active");
                });

                tab.classList.add("active");

                studentActiveFilter =
                    tab.dataset.filter || "all";

                updateStudentEmptyMessage();

                renderStudentEvents();

            }
        );

    });

}

function updateStudentEmptyMessage() {

    const emptyMessage =
        document.getElementById("emptyMessage");

    if (!emptyMessage) {
        return;
    }

    const messages = {
        all: "Your registered events will appear here.",
        upcoming: "You have no upcoming registered events.",
        completed: "You have no completed events yet.",
        cancelled: "You have no cancelled registrations."
    };

    emptyMessage.textContent =
        messages[studentActiveFilter] ||
        messages.all;

}

function getRegistrationEvent(registration) {

    if (!registration) {
        return null;
    }

    return registration.event || null;
}

function getAllStudentEvents() {

    const registeredEventIds = new Set(
        studentRegistrations
            .map(function (registration) {
                const event = getRegistrationEvent(registration);
                return event ? String(event._id) : null;
            })
            .filter(Boolean)
    );

    const availableEvents = approvedEvents
        .filter(function (event) {
            return !registeredEventIds.has(String(event._id));
        })
        .map(function (event) {
            return {
                event,
                status: "available",
                isAvailable: true,
                attendanceStatus: "not-marked"
            };
        });

    return studentRegistrations.concat(availableEvents);

}

function getStudentEventType(registration) {

    if (!registration) {
        return "upcoming";
    }

    const registrationStatus =
        String(
            registration.status || "registered"
        ).toLowerCase();

    if (registrationStatus === "cancelled") {
        return "cancelled";
    }

    const event =
        getRegistrationEvent(registration);

    if (!event) {
        return "upcoming";
    }

    const eventDate =
        new Date(event.eventDate);

    if (isNaN(eventDate.getTime())) {
        return "upcoming";
    }

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    if (eventDate < today) {
        return "completed";
    }

    const eventStatus =
        String(event.status || "").toLowerCase();

    if (
        eventStatus !== "approved" &&
        !registration.isAvailable
    ) {
        return "other";
    }

    return "upcoming";
}

function updateStudentStats() {

    let total = 0;

    let upcoming = 0;

    let completed = 0;

    const allEvents = getAllStudentEvents();

    allEvents.forEach(
        function (registration) {

            const type =
                getStudentEventType(
                    registration
                );

            if (type === "upcoming") {

                upcoming++;
                total++;

            }

            if (type === "completed") {

                completed++;
                total++;

            }

        }
    );

    setElementText(
        "totalEvents",
        total
    );

    setElementText(
        "upcomingEvents",
        upcoming
    );

    setElementText(
        "completedEvents",
        completed
    );

    const attendanceCount =
        studentRegistrations.filter(
            function (registration) {

                return (
                    registration.attendanceStatus ===
                        "present" ||

                    registration.attendanceStatus ===
                        "absent"
                );

            }
        ).length;

    setElementText(
        "attendanceEvents",
        studentAttendanceAvailable
            ? attendanceCount
            : "Unavailable"
    );

    console.log(
        "Student Stats:",
        {
            total,
            upcoming,
            completed,
            attendanceCount
        }
    );

}

function renderStudentEvents() {

    const list =
        document.getElementById("eventsList");

    const emptyState =
        document.getElementById("emptyState");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    const filtered =
        getAllStudentEvents().filter(
            function (registration) {

                const type =
                    getStudentEventType(
                        registration
                    );

                return (
                    studentActiveFilter === "all" ||
                    type === studentActiveFilter
                );

            }
        );

    if (filtered.length === 0) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    filtered.forEach(
        function (registration) {

            const card =
                createStudentEventCard(
                    registration
                );

            list.appendChild(card);

        }
    );

}

function createStudentEventCard(
    registration
) {

    const event =
        getRegistrationEvent(
            registration
        );

    const card =
        document.createElement("div");

    card.className =
        "my-event-card";

    if (!event) {
        return card;
    }

    const eventType =
        getStudentEventType(
            registration
        );

    const date =
        new Date(
            event.eventDate
        );

    const month =
        isNaN(date.getTime())
            ? "---"
            : date.toLocaleDateString(
                "en-IN",
                {
                    month: "short"
                }
            ).toUpperCase();

    const day =
        isNaN(date.getTime())
            ? "--"
            : date.getDate();

    const title =
        event.title ||
        "Untitled Event";

    const description =
        event.description ||
        "No description available.";

    const venue =
        event.venue || {};

    const venueName =
        venue.name ||
        "Venue not assigned";

    const startTime =
        event.startTime ||
        "--";

    const endTime =
        event.endTime ||
        "--";

    const statusText =
        registration.isAvailable
            ? "Available"
            : eventType === "completed"
            ? "Completed"
            : eventType === "cancelled"
                ? "Cancelled"
                : "Registered";

    const statusClass =
        registration.isAvailable
            ? "available"
            : eventType === "completed"
            ? "completed"
            : eventType === "cancelled"
                ? "cancelled"
                : "registered";

    const attendanceStatus =
        registration.attendanceStatus ||
        "not-marked";

    const attendanceStatusText =
        attendanceStatus === "present"
            ? "Present"
            : attendanceStatus === "absent"
                ? "Absent"
                : "Not Marked";

    card.dataset.status =
        eventType;

    card.innerHTML = `

        <div class="event-date">

            <span class="month">
                ${escapeHTML(month)}
            </span>

            <span class="day">
                ${escapeHTML(day)}
            </span>

        </div>

        <div class="event-content">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

            <div class="event-meta">

                <span>

                    <i class="bi bi-clock"></i>

                    ${escapeHTML(
                        formatTime(startTime)
                    )}

                    -

                    ${escapeHTML(
                        formatTime(endTime)
                    )}

                </span>

                <span>

                    <i class="bi bi-geo-alt"></i>

                    ${escapeHTML(
                        venueName
                    )}

                </span>

                <span>

                    <i class="bi bi-person-check"></i>

                    ${
                        registration.isAvailable
                            ? "Open for Registration"
                            : eventType === "cancelled"
                            ? "Registration Cancelled"
                            : "Registered"
                    }

                </span>

            </div>

        </div>

        <div class="event-actions">

            <span
                class="status ${statusClass}"
            >

                ${statusText}

            </span>

            <span
                class="attendance-status ${attendanceStatus}"
            >

                <i class="bi bi-person-check"></i>

                ${attendanceStatusText}

            </span>

            <div class="action-buttons">

                <button
                    class="details-btn"
                    type="button"
                    onclick="viewStudentEvent('${event._id}')"
                >
                    Details
                </button>

                ${
                    registration.isAvailable
                        ? `
                            <button
                                class="join-btn"
                                type="button"
                                onclick="registerApprovedEvent('${event._id}')"
                            >
                                Join Event
                            </button>
                          `
                        : eventType === "upcoming"
                        ? `
                            <button
                                class="cancel-btn"
                                type="button"
                                onclick="cancelStudentRegistration('${event._id}')"
                            >
                                Cancel
                            </button>
                          `
                        : ""
                }

            </div>

        </div>

    `;

    return card;
}

async function cancelStudentRegistration(
    eventId
) {

    if (!eventId) {
        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to cancel your registration for this event?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const token =
            getAuthToken();

        if (!token) {

            alert(
                "Please login again."
            );

            window.location.href =
                "../login.html";

            return;
        }

        const buttons =
            document.querySelectorAll(
                ".cancel-btn"
            );

        buttons.forEach(
            function (button) {

                button.disabled = true;

                button.textContent =
                    "Cancelling...";

            }
        );

        const response =
            await fetch(
                `${MY_EVENTS_API_URL}/registrations/${encodeURIComponent(eventId)}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "Cancel Registration Response:",
            data
        );

        if (
            response.status === 401
        ) {
            handleStudentUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to cancel registration."
            );

        }

        showToast(
            "Registration cancelled successfully."
        );

        await loadStudentMyEvents();

    } catch (error) {

        console.error(
            "Cancel Registration Error:",
            error
        );

        showToast(
            error.message ||
            "Unable to cancel registration."
        );

        const buttons =
            document.querySelectorAll(
                ".cancel-btn"
            );

        buttons.forEach(
            function (button) {

                button.disabled = false;

                button.textContent =
                    "Cancel";

            }
        );

    }

}

function viewStudentEvent(
    eventId
) {

    if (!eventId) {
        return;
    }

    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;

}

function browseEvents() {

    window.location.href =
    "event.html";

}

function handleStudentUnauthorized() {

    localStorage.removeItem(
        "campusVenueToken"
    );

    localStorage.removeItem(
        "campusVenueUser"
    );

    localStorage.removeItem(
        "campusVenueRole"
    );

    alert(
        "Your login session has expired. Please login again."
    );

    window.location.href =
        "../login.html";

}

async function initializeOrganizerMyEvents() {

    const user =
        getLoggedInUser();

    if (!user) {

        showOrganizerEmpty();

        return;
    }

    const organizerId =
        user.id ||
        user._id;

    if (!organizerId) {

        showOrganizerEmpty();

        return;
    }

    await loadOrganizerMyEvents(
        organizerId
    );

}

async function loadOrganizerMyEvents(
    organizerId
) {

    const eventGrid =
        document.getElementById(
            "eventGrid"
        );

    const emptyMessage =
        document.getElementById(
            "empty"
        );

    const loadingMessage =
        document.getElementById(
            "loading"
        );

    if (loadingMessage) {

        loadingMessage.style.display =
            "block";

    }

    try {

        const response =
            await fetch(
                `${MY_EVENTS_API_URL}/events/organizer/${organizerId}`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load events."
            );

        }

        organizerEvents =
            Array.isArray(data.events)
                ? data.events
                : [];

        renderOrganizerEvents(
            organizerEvents
        );

    } catch (error) {

        console.error(
            "Organizer Events Error:",
            error
        );

        if (eventGrid) {

            eventGrid.innerHTML = "";

        }

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";

            emptyMessage.innerHTML = `

                <h2>
                    Unable to Load Events
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    class="btn btn-primary"
                    onclick="location.reload()"
                >
                    Try Again
                </button>

            `;

        }

    } finally {

        if (loadingMessage) {

            loadingMessage.style.display =
                "none";

        }

    }

}

function renderOrganizerEvents(
    events
) {

    const eventGrid =
        document.getElementById(
            "eventGrid"
        );

    const emptyMessage =
        document.getElementById(
            "empty"
        );

    if (!eventGrid) {
        return;
    }

    eventGrid.innerHTML = "";

    if (
        !events ||
        events.length === 0
    ) {

        showOrganizerEmpty();

        return;
    }

    if (emptyMessage) {

        emptyMessage.style.display =
            "none";

    }

    events.forEach(
        function (event) {

            eventGrid.appendChild(
                createOrganizerEventCard(
                    event
                )
            );

        }
    );

}

function createOrganizerEventCard(
    event
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "card event-card";

    const title =
        event.title ||
        "Untitled Event";

    const description =
        event.description ||
        "No description available.";

    const venue =
        event.venue ||
        {};

    const venueName =
        venue.name ||
        "Venue not assigned";

    const venueLocation =
        venue.location ||
        "";

    const status =
        String(
            event.status ||
            "pending"
        ).toLowerCase();

    card.innerHTML = `

        <div class="event-card-header">

            <div>

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <span
                    class="badge ${getStatusClass(status)}"
                >
                    ${formatStatus(status)}
                </span>

            </div>

        </div>

        <div class="event-card-body">

            <p class="event-description">
                ${escapeHTML(description)}
            </p>

            <div class="event-info">

                <div class="event-info-item">

                    <span class="event-icon">
                        📅
                    </span>

                    <div>

                        <strong>
                            Date
                        </strong>

                        <p>
                            ${formatDate(
                                event.eventDate
                            )}
                        </p>

                    </div>

                </div>

                <div class="event-info-item">

                    <span class="event-icon">
                        ⏰
                    </span>

                    <div>

                        <strong>
                            Time
                        </strong>

                        <p>

                            ${escapeHTML(
                                event.startTime ||
                                "--"
                            )}

                            -

                            ${escapeHTML(
                                event.endTime ||
                                "--"
                            )}

                        </p>

                    </div>

                </div>

                <div class="event-info-item">

                    <span class="event-icon">
                        🏛️
                    </span>

                    <div>

                        <strong>
                            Venue
                        </strong>

                        <p>
                            ${escapeHTML(
                                venueName
                            )}
                        </p>

                        ${
                            venueLocation
                                ? `
                                    <small>
                                        ${escapeHTML(
                                            venueLocation
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>

                <div class="event-info-item">

                    <span class="event-icon">
                        👥
                    </span>

                    <div>

                        <strong>
                            Participants
                        </strong>

                        <p>
                            ${
                                event.expectedParticipants ||
                                0
                            }
                        </p>

                    </div>

                </div>

            </div>

        </div>

        <div class="event-card-footer">

            <button
                class="btn btn-outline"
                onclick="viewOrganizerEvent('${event._id}')"
            >
                View Details
            </button>

            ${
                status === "pending"
                    ? `
                        <button
                            class="btn btn-danger"
                            onclick="deleteOrganizerEvent('${event._id}')"
                        >
                            Delete
                        </button>
                      `
                    : ""
            }

        </div>

    `;

    return card;

}

function viewOrganizerEvent(
    eventId
) {

    if (!eventId) {
        return;
    }

    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;

}

async function deleteOrganizerEvent(
    eventId
) {

    if (!eventId) {
        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this event?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const token =
            getAuthToken();

        if (!token) {

            alert(
                "Please login again."
            );

            window.location.href =
                "../login.html";

            return;
        }

        const response =
            await fetch(
                `${MY_EVENTS_API_URL}/events/${eventId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (response.status === 401) {

            handleStudentUnauthorized();

            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete event."
            );

        }

        alert(
            "Event deleted successfully."
        );

        const user =
            getLoggedInUser();

        if (!user) {
            return;
        }

        const organizerId =
            user.id ||
            user._id;

        await loadOrganizerMyEvents(
            organizerId
        );

    } catch (error) {

        console.error(
            "Delete Event Error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete event."
        );

    }

}

function showOrganizerEmpty() {

    const eventGrid =
        document.getElementById(
            "eventGrid"
        );

    const emptyMessage =
        document.getElementById(
            "empty"
        );

    if (eventGrid) {

        eventGrid.innerHTML = "";

    }

    if (emptyMessage) {

        emptyMessage.style.display =
            "block";

    }

}

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}

function formatDate(
    value
) {

    if (!value) {

        return "Date not available";

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return "Invalid date";

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}

function formatTime(
    value
) {

    if (!value) {

        return "--";

    }

    const parts =
        String(value).split(":");

    if (parts.length < 2) {

        return value;

    }

    let hour =
        parseInt(
            parts[0],
            10
        );

    const minute =
        parts[1];

    if (isNaN(hour)) {

        return value;

    }

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 ||
        12;

    return `${hour}:${minute} ${period}`;

}

function formatStatus(
    status
) {

    if (!status) {

        return "Pending";

    }

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );

}

function getStatusClass(
    status
) {

    switch (status) {

        case "approved":
            return "approved";

        case "pending":
            return "pending";

        case "rejected":
            return "rejected";

        case "cancelled":
            return "cancelled";

        default:
            return "pending";

    }

}

function showStudentError(
    message
) {

    const loading =
        document.getElementById(
            "eventsLoading"
        );

    const errorBox =
        document.getElementById(
            "eventsError"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    if (loading) {

        loading.style.display =
            "none";

    }

    if (emptyState) {

        emptyState.style.display =
            "none";

    }

    if (errorBox) {

        errorBox.textContent =
            message ||
            "Unable to load events.";

        errorBox.style.display =
            "block";

    }

}

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {

        alert(message);

        return;

    }

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

window.browseEvents =
    browseEvents;

window.viewStudentEvent =
    viewStudentEvent;

window.cancelStudentRegistration =
    cancelStudentRegistration;

window.viewOrganizerEvent =
    viewOrganizerEvent;

window.deleteOrganizerEvent =
    deleteOrganizerEvent;

window.loadStudentMyEvents =
    loadStudentMyEvents;