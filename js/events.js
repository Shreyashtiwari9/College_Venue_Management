const EVENTS_API_BASE_URL = "/api";

let allEvents = [];




document.addEventListener("DOMContentLoaded", function () {

    console.log("CampusVenue Events JS Loaded");




    const adminPage =
        document.getElementById("eventTable");

    const studentPage =
        document.getElementById("eventsGrid");


    if (adminPage) {

        console.log(
            "Admin Events Page Detected"
        );

        initializeAdminEvents();

    }


    if (studentPage) {

        console.log(
            "Student Events Page Detected"
        );

        initializeStudentEvents();

    }

});




function initializeAdminEvents() {

    loadAdminEvents();


    const searchInput =
        document.getElementById("search");

    const categoryFilter =
        document.getElementById("category");

    const statusFilter =
        document.getElementById("status");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyAdminFilters
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyAdminFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyAdminFilters
        );

    }

}




async function loadAdminEvents() {

    const loading =
        document.getElementById(
            "eventsLoading"
        );

    const errorBox =
        document.getElementById(
            "eventsError"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

        errorBox.textContent = "";

    }


    try {

        console.log(
            "Admin fetching:",
            `${EVENTS_API_BASE_URL}/events`
        );


        const response =
            await fetch(
                `${EVENTS_API_BASE_URL}/events`
            );


        const data =
            await response.json();


        console.log(
            "Admin Events API:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Events API returned unsuccessful response."
            );

        }


        allEvents =
            Array.isArray(data.events)
                ? data.events
                : [];


        if (loading) {

            loading.style.display =
                "none";

        }


        renderAdminEvents(
            allEvents
        );


    } catch (error) {

        console.error(
            "ADMIN EVENT LOAD ERROR:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.textContent =
                "Unable to load events: " +
                error.message;

            errorBox.style.display =
                "block";

        }

    }

}




function renderAdminEvents(events) {

    const tableBody =
        document.getElementById(
            "eventTable"
        );

    const noEvents =
        document.getElementById(
            "noEvents"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (
        !Array.isArray(events) ||
        events.length === 0
    ) {

        if (noEvents) {

            noEvents.style.display =
                "block";

        }

        return;

    }


    if (noEvents) {

        noEvents.style.display =
            "none";

    }


    events.forEach(
        function (event) {

            const row =
                document.createElement(
                    "tr"
                );


            const title =
                event.title ||
                "Untitled Event";


            const venue =
                event.venue &&
                event.venue.name
                    ? event.venue.name
                    : "Not assigned";


            const organizer =
                event.organizer &&
                event.organizer.name
                    ? event.organizer.name
                    : "Not assigned";


            const status =
                normalizeEventStatus(
                    event.status
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(title)}
                    </strong>
                </td>

                <td>
                    —
                </td>

                <td>
                    ${formatEventDate(
                        event.eventDate
                    )}
                </td>

                <td>
                    ${escapeHTML(venue)}
                </td>

                <td>
                    ${escapeHTML(organizer)}
                </td>

                <td>

                    <span
                        class="status-badge ${getStatusClass(status)}"
                    >
                        ${status}
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="btn btn-outline"
                        onclick="viewEvent('${event._id}')"
                    >
                        View
                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}




function applyAdminFilters() {

    const searchInput =
        document.getElementById(
            "search"
        );

    const categoryFilter =
        document.getElementById(
            "category"
        );

    const statusFilter =
        document.getElementById(
            "status"
        );


    const searchValue =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const categoryValue =
        categoryFilter
            ? categoryFilter.value
            : "";


    const statusValue =
        statusFilter
            ? statusFilter.value
            : "";


    const filteredEvents =
        allEvents.filter(
            function (event) {

                const title =
                    (
                        event.title || ""
                    ).toLowerCase();


                const description =
                    (
                        event.description || ""
                    ).toLowerCase();


                const venue =
                    (
                        event.venue?.name || ""
                    ).toLowerCase();


                const organizer =
                    (
                        event.organizer?.name || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchValue ||
                    title.includes(
                        searchValue
                    ) ||
                    description.includes(
                        searchValue
                    ) ||
                    venue.includes(
                        searchValue
                    ) ||
                    organizer.includes(
                        searchValue
                    );





                const matchesCategory =
                    !categoryValue ||
                    String(event.category || "Other")
                        .toLowerCase() === categoryValue.toLowerCase();


                const eventStatus =
                    normalizeEventStatus(
                        event.status
                    );


                const matchesStatus =
                    !statusValue ||
                    eventStatus.toLowerCase() ===
                    statusValue.toLowerCase();


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                );

            }
        );


    renderAdminEvents(
        filteredEvents
    );

}




function initializeStudentEvents() {

    loadStudentEvents();


    const searchInput =
        document.getElementById(
            "eventSearch"
        );

    const dateFilter =
        document.getElementById(
            "dateFilter"
        );

    const resetBtn =
        document.getElementById(
            "resetBtn"
        );





    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (categoryFilter) {
        categoryFilter.value = "all";
        categoryFilter.addEventListener(
            "change",
            applyStudentFilters
        );
    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyStudentFilters
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyStudentFilters
        );

    }


    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value = "";

                }


                if (dateFilter) {

                    dateFilter.value =
                        "all";

                }


                if (categoryFilter) {

                    categoryFilter.value =
                        "all";

                }


                applyStudentFilters();

            }
        );

    }

}




async function loadStudentEvents() {

    const loading =
        document.getElementById(
            "eventsLoading"
        );

    const errorBox =
        document.getElementById(
            "eventsError"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

        errorBox.textContent = "";

    }


    try {

        console.log(
            "Student fetching:",
            `${EVENTS_API_BASE_URL}/events`
        );


        const response =
            await fetch(
                `${EVENTS_API_BASE_URL}/events`
            );


        console.log(
            "Student Events Status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Student Events API:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Events API returned unsuccessful response."
            );

        }





        const approvedEvents =
            Array.isArray(data.events)
                ? data.events.filter(
                    function (event) {

                        return (
                            String(
                                event.status
                            ).toLowerCase() ===
                            "approved"
                        );

                    }
                )
                : [];


        allEvents =
            approvedEvents;


        console.log(
            "Approved Student Events:",
            allEvents.length
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        renderStudentEvents(
            allEvents
        );


    } catch (error) {

        console.error(
            "STUDENT EVENT LOAD ERROR:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.textContent =
                "Unable to load events: " +
                error.message;

            errorBox.style.display =
                "block";

        }

    }

}




function renderStudentEvents(events) {

    const eventsGrid =
        document.getElementById(
            "eventsGrid"
        );

    const noEvents =
        document.getElementById(
            "noEvents"
        );

    const eventCount =
        document.getElementById(
            "eventCount"
        );


    if (!eventsGrid) {

        return;

    }


    eventsGrid.innerHTML = "";


    if (eventCount) {

        eventCount.textContent =
            Array.isArray(events)
                ? events.length
                : 0;

    }


    if (
        !Array.isArray(events) ||
        events.length === 0
    ) {

        if (noEvents) {

            noEvents.style.display =
                "block";

        }

        return;

    }


    if (noEvents) {

        noEvents.style.display =
            "none";

    }


    events.forEach(
        function (event) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "event-card";


            const title =
                event.title ||
                "Untitled Event";


            const description =
                event.description ||
                "No description available.";

            const category =
                event.category ||
                "Other";

            const categoryClass =
                String(category)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "") ||
                "other";


            const venueName =
                event.venue &&
                event.venue.name
                    ? event.venue.name
                    : "Venue not assigned";


            const venueLocation =
                event.venue &&
                event.venue.location
                    ? event.venue.location
                    : "";


            const participants =
                event.expectedParticipants ??
                0;


            const status =
                normalizeEventStatus(
                    event.status
                );


            const icon =
                getEventIcon(
                    title
                );


            const dateText =
                formatEventDate(
                    event.eventDate
                );


            const timeText =
                formatEventTime(
                    event.startTime,
                    event.endTime
                );


            card.innerHTML = `

                <div class="event-cover ${categoryClass}">

                    <span class="event-category">
                        ${escapeHTML(category)}
                    </span>

                    <span
                        class="event-status ${getStatusClass(status)}"
                    >
                        ${status}
                    </span>

                    <i class="bi ${icon}"></i>

                </div>


                <div class="event-body">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>


                    <p class="event-description">

                        ${escapeHTML(
                            description
                        )}

                    </p>


                    <div class="event-info">


                        <div class="event-info-item">

                            <i class="bi bi-calendar3"></i>

                            <span>
                                ${dateText}
                            </span>

                        </div>


                        <div class="event-info-item">

                            <i class="bi bi-clock"></i>

                            <span>
                                ${timeText}
                            </span>

                        </div>


                        <div class="event-info-item">

                            <i class="bi bi-geo-alt"></i>

                            <span>
                                ${escapeHTML(
                                    venueName
                                )}
                                ${
                                    venueLocation
                                        ? " • " +
                                          escapeHTML(
                                              venueLocation
                                          )
                                        : ""
                                }
                            </span>

                        </div>


                        <div class="event-info-item">

                            <i class="bi bi-people"></i>

                            <span>
                                ${participants}
                                Expected Participants
                            </span>

                        </div>


                    </div>


                    <div class="event-footer">


                        <button
                            type="button"
                            class="details-btn"
                            onclick="viewStudentEvent('${event._id}')"
                        >
                            Details
                        </button>


                        <button
                            type="button"
                            class="register-btn"
                            onclick="registerEvent('${event._id}', this)"
                        >
                            Register
                        </button>


                    </div>

                </div>

            `;


            eventsGrid.appendChild(
                card
            );

        }
    );


    console.log(
        "Student events rendered:",
        events.length
    );

}




function applyStudentFilters() {

    const searchInput =
        document.getElementById(
            "eventSearch"
        );

    const dateFilter =
        document.getElementById(
            "dateFilter"
        );

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const searchValue =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const dateValue =
        dateFilter
            ? dateFilter.value
            : "all";

    const categoryValue =
        categoryFilter
            ? categoryFilter.value.toLowerCase()
            : "all";


    const now =
        new Date();


    const filteredEvents =
        allEvents.filter(
            function (event) {

                const title =
                    (
                        event.title || ""
                    ).toLowerCase();


                const description =
                    (
                        event.description || ""
                    ).toLowerCase();


                const venue =
                    (
                        event.venue?.name || ""
                    ).toLowerCase();


                const location =
                    (
                        event.venue?.location || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchValue ||
                    title.includes(
                        searchValue
                    ) ||
                    description.includes(
                        searchValue
                    ) ||
                    venue.includes(
                        searchValue
                    ) ||
                    location.includes(
                        searchValue
                    );


                const matchesDate =
                    matchesStudentDateFilter(
                        event.eventDate,
                        dateValue,
                        now
                    );

                const matchesCategory =
                    categoryValue === "all" ||
                    String(event.category || "Other")
                        .toLowerCase() === categoryValue;


                return (
                    matchesSearch &&
                    matchesDate &&
                    matchesCategory
                );

            }
        );


    renderStudentEvents(
        filteredEvents
    );

}




function matchesStudentDateFilter(
    eventDate,
    filter,
    now
) {

    if (
        !eventDate ||
        filter === "all"
    ) {

        return true;

    }


    const date =
        new Date(
            eventDate
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;

    }





    const eventDay =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );


    const today =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    if (filter === "today") {

        return (
            eventDay.getTime() ===
            today.getTime()
        );

    }


    if (filter === "week") {

        const day =
            today.getDay();


        const diffToMonday =
            day === 0
                ? 6
                : day - 1;


        const weekStart =
            new Date(today);


        weekStart.setDate(
            today.getDate() -
            diffToMonday
        );


        const weekEnd =
            new Date(
                weekStart
            );


        weekEnd.setDate(
            weekStart.getDate() +
            6
        );


        return (
            eventDay >= weekStart &&
            eventDay <= weekEnd
        );

    }


    if (filter === "month") {

        return (
            eventDay.getMonth() ===
            today.getMonth() &&
            eventDay.getFullYear() ===
            today.getFullYear()
        );

    }


    return true;

}




window.viewEvent = function (
    eventId
) {

    if (!eventId) {

        alert(
            "Event ID is missing."
        );

        return;

    }


    window.location.href =
        `event-details.html?id=${encodeURIComponent(
            eventId
        )}`;

};




window.viewStudentEvent = function (
    eventId
) {

    if (!eventId) {

        alert(
            "Event ID is missing."
        );

        return;

    }


    window.location.href =
        `event-details.html?id=${encodeURIComponent(
            eventId
        )}`;

};




window.registerEvent = async function (
    eventId,
    button
) {

    if (!eventId) {

        alert(
            "Event ID is missing."
        );

        return;

    }


    const token =
        localStorage.getItem(
            "campusVenueToken"
        );

    if (!token) {
        alert("Please login as a student before registering.");
        window.location.href = "/login.html";
        return;
    }

    const originalText =
        button
            ? button.innerHTML
            : "Register";

    if (button) {
        button.disabled = true;
        button.textContent = "Registering...";
    }

    try {
        const response =
            await fetch(
                `${EVENTS_API_BASE_URL}/registrations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ eventId })
                }
            );

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("campusVenueToken");
            localStorage.removeItem("campusVenueUser");
            localStorage.removeItem("campusVenueRole");
            alert("Your login session has expired. Please login again.");
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to register for this event."
            );
        }

        alert("Event registration successful!");
        window.location.href = "/student/my-events.html";

    } catch (error) {
        console.error("Event registration error:", error);
        alert(error.message);

        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

};




function formatEventDate(
    dateString
) {

    if (!dateString) {

        return "—";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}




function formatEventTime(
    startTime,
    endTime
) {

    if (
        !startTime &&
        !endTime
    ) {

        return "Time not available";

    }


    if (
        startTime &&
        endTime
    ) {

        return (
            formatTime(startTime) +
            " - " +
            formatTime(endTime)
        );

    }


    return formatTime(
        startTime ||
        endTime
    );

}




function formatTime(
    timeString
) {

    if (!timeString) {

        return "—";

    }


    const parts =
        String(
            timeString
        ).split(":");


    if (parts.length < 2) {

        return timeString;

    }


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1];


    if (
        Number.isNaN(hour)
    ) {

        return timeString;

    }


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return (
        hour +
        ":" +
        minute +
        " " +
        period
    );

}




function normalizeEventStatus(
    status
) {

    if (!status) {

        return "Pending";

    }


    const value =
        String(status)
            .toLowerCase();


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}




function getStatusClass(
    status
) {

    switch (
        String(status)
            .toLowerCase()
    ) {

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




function getEventIcon(
    title
) {

    const name =
        String(
            title || ""
        ).toLowerCase();


    if (
        name.includes("python") ||
        name.includes("coding") ||
        name.includes("program")
    ) {

        return "bi-code-slash";

    }


    if (
        name.includes("workshop")
    ) {

        return "bi-laptop";

    }


    if (
        name.includes("seminar") ||
        name.includes("career")
    ) {

        return "bi-mic";

    }


    if (
        name.includes("sports") ||
        name.includes("competition")
    ) {

        return "bi-trophy";

    }


    if (
        name.includes("cultural") ||
        name.includes("freshers")
    ) {

        return "bi-stars";

    }


    return "bi-calendar-event";

}




function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

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
