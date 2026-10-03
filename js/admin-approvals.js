const API_BASE = "/api";

function getAuthToken() {
    return localStorage.getItem("campusVenueToken");
}

async function loadPendingEvents() {

    const loadingBox = document.getElementById("loadingBox");
    const approvalGrid = document.getElementById("approvalGrid");
    const emptyBox = document.getElementById("emptyBox");

    const token = getAuthToken();

    if (!token) {
        loadingBox.style.display = "none";
        approvalGrid.style.display = "block";

        approvalGrid.innerHTML = `
            <div class="error-box">
                <h2>Authentication Required</h2>
                <p>Please login again to view approval requests.</p>
            </div>
        `;

        return;
    }

    try {

        loadingBox.style.display = "block";
        approvalGrid.style.display = "none";
        emptyBox.style.display = "none";

        const response = await fetch(
            `${API_BASE}/events`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Events API Response:", data);

        if (response.status === 401) {
            showMessage(
                "Your login session has expired. Please login again.",
                "error"
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );
        }

        if (!data.success) {
            throw new Error(
                data.message ||
                "Unable to load events."
            );
        }

        const events = Array.isArray(data.events)
            ? data.events
            : [];

        const pendingEvents = events.filter(
            event => event.status === "pending"
        );

        loadingBox.style.display = "none";

        if (pendingEvents.length === 0) {

            approvalGrid.innerHTML = "";

            approvalGrid.style.display = "none";

            emptyBox.style.display = "block";

            return;
        }

        approvalGrid.innerHTML =
            pendingEvents
                .map(event => createApprovalCard(event))
                .join("");

        approvalGrid.style.display = "grid";

    } catch (error) {

        console.error(
            "Load Pending Events Error:",
            error
        );

        loadingBox.style.display = "none";

        approvalGrid.style.display = "block";

        approvalGrid.innerHTML = `
            <div class="error-box">

                <h2>Unable to Load Requests</h2>

                <p>
                    ${escapeHTML(error.message)}
                </p>

                <button
                    class="btn btn-primary"
                    onclick="loadPendingEvents()">
                    Try Again
                </button>

            </div>
        `;
    }
}

function createApprovalCard(event) {

    const eventId =
        event._id;

    const title =
        event.title ||
        "Untitled Event";

    const description =
        event.description ||
        "No description provided.";

    const organizerName =
        event.organizer?.name ||
        event.organizer?.fullName ||
        event.organizer?.email ||
        "Unknown Organizer";

    const organizerEmail =
        event.organizer?.email ||
        "Not available";

    const venueName =
        event.venue?.name ||
        "Venue not available";

    const venueLocation =
        event.venue?.location ||
        event.venue?.address ||
        "Not available";

    const venueCapacity =
        event.venue?.capacity ||
        0;

    const participants =
        event.expectedParticipants ||
        0;

    const eventDate =
        formatDate(event.eventDate);

    const startTime =
        formatTime(event.startTime);

    const endTime =
        formatTime(event.endTime);

    return `
        <div
            class="approval-card request"
            id="event-${escapeHTML(eventId)}">

            <span class="approval-badge pending-badge">
                Pending
            </span>

            <h2>
                ${escapeHTML(title)}
            </h2>

            <div class="approval-details">
                <p>
                    <strong>Organizer:</strong>
                    ${escapeHTML(organizerName)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(organizerEmail)}
                </p>

                <p>
                    <strong>Venue:</strong>
                    ${escapeHTML(venueName)}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHTML(venueLocation)}
                </p>

                <p>
                    <strong>Venue Capacity:</strong>
                    ${escapeHTML(String(venueCapacity))}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(eventDate)}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${escapeHTML(startTime)}
                    –
                    ${escapeHTML(endTime)}
                </p>

                <p>
                    <strong>Expected Participants:</strong>
                    ${escapeHTML(String(participants))}
                </p>
            </div>

            <div class="event-description">

                <strong>Description:</strong>

                <p>
                    ${escapeHTML(description)}
                </p>

            </div>

            <div class="actions">

                <button
                    class="btn approve"
                    onclick="updateEventStatus(
                        '${escapeJS(eventId)}',
                        'approved'
                    )">
                    Approve
                </button>

                <button
                    class="btn reject"
                    onclick="updateEventStatus(
                        '${escapeJS(eventId)}',
                        'rejected'
                    )">
                    Reject
                </button>

            </div>

        </div>
    `;
}

async function updateEventStatus(
    eventId,
    newStatus
) {

    const actionText =
        newStatus === "approved"
            ? "approve"
            : "reject";

    const confirmation =
        confirm(
            `Are you sure you want to ${actionText} this event?`
        );

    if (!confirmation) {
        return;
    }

    const card =
        document.getElementById(
            `event-${eventId}`
        );

    if (card) {
        card.classList.add(
            "action-loading"
        );
    }

    const token =
        getAuthToken();

    if (!token) {

        if (card) {
            card.classList.remove(
                "action-loading"
            );
        }

        showMessage(
            "Your login session has expired. Please login again.",
            "error"
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/events/${eventId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "Update Event Response:",
            data
        );

        if (response.status === 401) {

            showMessage(
                "Your login session has expired. Please login again.",
                "error"
            );

            if (card) {
                card.classList.remove(
                    "action-loading"
                );
            }

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to ${actionText} event.`
            );
        }

        showMessage(
            newStatus === "approved"
                ? "Event approved successfully."
                : "Event rejected successfully.",
            "success"
        );

        if (card) {
            card.remove();
        }

        const remainingCards =
            document.querySelectorAll(
                ".approval-card"
            );

        if (remainingCards.length === 0) {

            document.getElementById(
                "approvalGrid"
            ).style.display = "none";

            document.getElementById(
                "emptyBox"
            ).style.display = "block";
        }

    } catch (error) {

        console.error(
            "Update Event Status Error:",
            error
        );

        if (card) {
            card.classList.remove(
                "action-loading"
            );
        }

        showMessage(
            error.message ||
            "Something went wrong.",
            "error"
        );
    }
}

function showMessage(
    message,
    type
) {

    const successMessage =
        document.getElementById(
            "successMessage"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );

    successMessage.style.display =
        "none";

    errorMessage.style.display =
        "none";

    if (type === "success") {

        successMessage.textContent =
            message;

        successMessage.style.display =
            "block";

    } else {

        errorMessage.textContent =
            message;

        errorMessage.style.display =
            "block";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    setTimeout(() => {

        successMessage.style.display =
            "none";

        errorMessage.style.display =
            "none";

    }, 4000);
}

function formatDate(dateString) {

    if (!dateString) {
        return "Not specified";
    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatTime(timeString) {

    if (!timeString) {
        return "Not specified";
    }

    const parts =
        timeString.split(":");

    if (parts.length < 2) {
        return timeString;
    }

    let hours =
        parseInt(
            parts[0],
            10
        );

    const minutes =
        parts[1];

    if (isNaN(hours)) {
        return timeString;
    }

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    hours =
        hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}

function escapeHTML(value) {

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

function escapeJS(value) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadPendingEvents();
    }
);