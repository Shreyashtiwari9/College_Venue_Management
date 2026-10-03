const ORGANIZER_DASHBOARD_API =
    window.CAMPUS_VENUE_API_BASE_URL ||
    `${window.location.origin}/api`;

async function readOrganizerDashboardResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        throw new Error(
            "The API returned a non-JSON response. Check that the backend is running and the API URL is configured correctly."
        );
    }

    return response.json();
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadOrganizerProfile().then(function (isOrganizer) {
            if (isOrganizer) {
                setTimeout(loadOrganizerDashboard, 100);
            }
        });
    }
);

async function loadOrganizerProfile() {
    const profileState = document.getElementById("organizerProfileState");
    const profileGrid = document.getElementById("organizerProfileGrid");

    try {
        const response = await fetch(
            `${ORGANIZER_DASHBOARD_API}/auth/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("campusVenueToken");
            localStorage.removeItem("campusVenueUser");
            localStorage.removeItem("campusVenueRole");
            window.location.replace("../login.html");
            return false;
        }

        const data = await readOrganizerDashboardResponse(response);

        if (!response.ok || !data.success || !data.user) {
            throw new Error(data.message || "Unable to load organizer profile.");
        }

        if (data.user.role !== "organizer") {
            const dashboardByRole = {
                student: "../student/dashboard.html",
                admin: "../admin/dashboard.html"
            };
            window.location.replace(dashboardByRole[data.user.role] || "../login.html");
            return false;
        }

        localStorage.setItem("campusVenueUser", JSON.stringify(data.user));

        const organizerTypeLabels = {
            "faculty-coordinator": "Faculty Coordinator",
            "staff-coordinator": "Staff Coordinator",
            "club-coordinator": "Club Coordinator",
            "student-club-representative": "Student Club Representative"
        };
        const profileValues = {
            ...data.user,
            organizerType: organizerTypeLabels[data.user.organizerType] || data.user.organizerType
        };

        document.querySelectorAll("[data-organizer-profile]").forEach(function (element) {
            const field = element.dataset.organizerProfile;
            element.textContent = profileValues[field] || "Not provided";
        });

        profileGrid.hidden = false;
        profileState.textContent = "Account active";
        return true;
    } catch (error) {
        console.error("Organizer Profile Error:", error);
        if (profileState) {
            profileState.textContent = error.message || "Unable to load account details.";
        }
        return false;
    }
}

async function loadOrganizerDashboard() {
    const upcomingContainer =
        document.getElementById(
            "upcomingEvents"
        );

    try {
        const userData =
            localStorage.getItem(
                "campusVenueUser"
            );

        if (!userData) {
            throw new Error(
                "Organizer login information not found."
            );
        }

        const user =
            JSON.parse(userData);

        const organizerId =
            user._id ||
            user.id ||
            user.userId;

        if (!organizerId) {
            console.error(
                "Logged-in User Data:",
                user
            );

            throw new Error(
                "Organizer ID not found."
            );
        }

        const response =
            await fetch(
                `${ORGANIZER_DASHBOARD_API}/events/organizer/${encodeURIComponent(organizerId)}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${localStorage.getItem("campusVenueToken")}`
                    }
                }
            );

        const data =
            await readOrganizerDashboardResponse(response);

        console.log(
            "Organizer Dashboard Response:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );
        }

        const events =
            Array.isArray(data.events)
                ? data.events
                : [];

        updateDashboardStats(
            events
        );

        renderUpcomingEvents(
            events
        );

    } catch (error) {
        console.error(
            "Organizer Dashboard Error:",
            error
        );

        updateDashboardStats(null);

        if (upcomingContainer) {
            upcomingContainer.innerHTML = `
                <div class="event-row">
                    <div>
                        <strong>
                            Unable to load events
                        </strong>

                        <p>
                            ${escapeHTML(
                                error.message
                            )}
                        </p>
                    </div>
                </div>
            `;
        }
    }
}

function updateDashboardStats(
    events
) {
    if (!Array.isArray(events)) {
        [
            "totalEvents",
            "pendingEvents",
            "participantsCount",
            "completedEvents"
        ].forEach(function (id) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = "Unavailable";
            }
        });

        return;
    }

    const total =
        events.length;

    const pending =
        events.filter(
            event =>
                event.status ===
                "pending"
        ).length;

    const completed =
        events.filter(
            event =>
                isCompletedEvent(event)
        ).length;

    const participants =
        events.reduce(
            function (
                totalParticipants,
                event
            ) {
                return (
                    totalParticipants +
                    Number(
                        event.expectedParticipants ||
                        0
                    )
                );
            },
            0
        );

    const totalElement =
        document.getElementById(
            "totalEvents"
        );

    const pendingElement =
        document.getElementById(
            "pendingEvents"
        );

    const participantsElement =
        document.getElementById(
            "participantsCount"
        );

    const completedElement =
        document.getElementById(
            "completedEvents"
        );

    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (participantsElement) {
        participantsElement.textContent =
            participants;
    }

    if (completedElement) {
        completedElement.textContent =
            completed;
    }
}

function renderUpcomingEvents(
    events
) {
    const container =
        document.getElementById(
            "upcomingEvents"
        );

    if (!container) {
        return;
    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const upcomingEvents =
        events
            .filter(
                function (event) {
                    if (
                        !event.eventDate
                    ) {
                        return false;
                    }

                    const eventDate =
                        new Date(
                            event.eventDate
                        );

                    eventDate.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    return (
                        eventDate >=
                        today
                    );
                }
            )
            .sort(
                function (a, b) {
                    return (
                        new Date(
                            a.eventDate
                        ) -
                        new Date(
                            b.eventDate
                        )
                    );
                }
            )
            .slice(0, 3);

    if (
        upcomingEvents.length === 0
    ) {
        container.innerHTML = `
            <div class="event-row">
                <div>
                    <strong>
                        No Upcoming Events
                    </strong>

                    <p>
                        Create an event to see it here.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    container.innerHTML =
        upcomingEvents
            .map(
                function (event) {
                    return createUpcomingEvent(
                        event
                    );
                }
            )
            .join("");
}

function createUpcomingEvent(
    event
) {
    const title =
        event.title ||
        "Untitled Event";

    const date =
        formatEventDate(
            event.eventDate
        );

    const venue =
        event.venue?.name ||
        "Venue not available";

    const status =
        event.status ||
        "pending";

    const statusText =
        status.charAt(0).toUpperCase() +
        status.slice(1);

    return `
        <div class="event-row">
            <div>
                <strong>
                    ${escapeHTML(title)}
                </strong>

                <p>
                    ${escapeHTML(date)}
                    •
                    ${escapeHTML(venue)}
                </p>
            </div>

            <span class="badge ${escapeHTML(status)}">
                ${escapeHTML(statusText)}
            </span>
        </div>
    `;
}

function isCompletedEvent(
    event
) {
    if (
        event.status !==
        "approved" ||
        !event.eventDate
    ) {
        return false;
    }

    const eventDate =
        new Date(
            event.eventDate
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    eventDate.setHours(
        0,
        0,
        0,
        0
    );

    return eventDate < today;
}

function formatEventDate(
    dateValue
) {
    const date =
        new Date(dateValue);

    if (
        isNaN(
            date.getTime()
        )
    ) {
        return "Date not available";
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