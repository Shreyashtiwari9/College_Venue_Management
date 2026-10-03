
const ADMIN_EVENTS_API_URL = "/api";

let allEvents = [];


document.addEventListener("DOMContentLoaded", () => {


    const table = document.getElementById("eventTable");

    if (table) {
        table.innerHTML = "";
    }

    loadEvents();


    const searchInput = document.getElementById("search");
    const categorySelect = document.getElementById("category");
    const statusSelect = document.getElementById("status");


    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }


    if (categorySelect) {
        categorySelect.addEventListener("change", applyFilters);
    }


    if (statusSelect) {
        statusSelect.addEventListener("change", applyFilters);
    }

});


async function loadEvents() {

    const loading = document.getElementById("eventsLoading");
    const errorBox = document.getElementById("eventsError");
    const table = document.getElementById("eventTable");


    try {

        if (loading) {
            loading.style.display = "block";
        }


        if (errorBox) {
            errorBox.style.display = "none";
        }



        if (table) {
            table.innerHTML = "";
        }


        const response =
            await fetch(`${ADMIN_EVENTS_API_URL}/events`, {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                }
            });


        const data =
            await response.json();


        console.log("Events API Response:", data);


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load events."
            );

        }


        allEvents =
            Array.isArray(data.events)
                ? data.events
                : [];


        console.log(
            "Events loaded from MongoDB:",
            allEvents
        );


        applyFilters();


    } catch (error) {

        console.error(
            "Load Events Error:",
            error
        );


        if (table) {
            table.innerHTML = "";
        }


        if (loading) {
            loading.style.display = "none";
        }


        const noEvents =
            document.getElementById("noEvents");


        if (noEvents) {
            noEvents.style.display = "none";
        }


        if (errorBox) {

            errorBox.textContent =
                "Unable to load events. Please check the backend server.";

            errorBox.style.display = "block";

        }

    }

}


function applyFilters() {

    const searchElement =
        document.getElementById("search");


    const categoryElement =
        document.getElementById("category");


    const statusElement =
        document.getElementById("status");


    const searchValue =
        searchElement
            ?.value
            .trim()
            .toLowerCase() || "";


    const categoryValue =
        categoryElement?.value || "";


    const statusValue =
        statusElement?.value || "";


    const filteredEvents =
        allEvents.filter(event => {


            const title =
                event.title || "";


            const description =
                event.description || "";


            const venueName =
                event.venue?.name || "";


            const organizerName =
                event.organizer?.name || "";


            const matchesSearch =
                !searchValue ||

                title
                    .toLowerCase()
                    .includes(searchValue) ||

                description
                    .toLowerCase()
                    .includes(searchValue) ||

                venueName
                    .toLowerCase()
                    .includes(searchValue) ||

                organizerName
                    .toLowerCase()
                    .includes(searchValue);




            const eventCategory =
                getEventCategory(event);

            const matchesCategory =
                !categoryValue ||
                eventCategory.toLowerCase() ===
                categoryValue.toLowerCase();


            const matchesStatus =
                !statusValue ||

                normalizeStatus(event.status) ===
                normalizeStatus(statusValue);


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    renderEvents(filteredEvents);

}


function renderEvents(events) {

    const table =
        document.getElementById("eventTable");


    const loading =
        document.getElementById("eventsLoading");


    const noEvents =
        document.getElementById("noEvents");


    if (!table) {
        return;
    }


    if (loading) {
        loading.style.display = "none";
    }



    table.innerHTML = "";


    if (!events.length) {

        if (noEvents) {
            noEvents.style.display = "block";
        }

        return;

    }


    if (noEvents) {
        noEvents.style.display = "none";
    }


    events.forEach(event => {


        const row =
            document.createElement("tr");


        const title =
            escapeHTML(
                event.title ||
                "Untitled Event"
            );


        const category =
            escapeHTML(
                getEventCategory(event)
            );


        const date =
            formatDate(
                event.eventDate
            );


        const venue =
            escapeHTML(
                event.venue?.name ||
                "Venue not available"
            );


        const organizer =
            escapeHTML(
                event.organizer?.name ||
                "Organizer not available"
            );


        const status =
            normalizeStatus(
                event.status
            );


        row.innerHTML = `

            <td>
                ${title}
            </td>

            <td>
                ${category}
            </td>

            <td>
                ${date}
            </td>

            <td>
                ${venue}
            </td>

            <td>
                ${organizer}
            </td>

            <td>

                <span class="badge ${getStatusClass(status)}">
                    ${escapeHTML(status)}
                </span>

            </td>

            <td>

                <button
                    class="view-btn"
                    onclick="viewEvent('${event._id}')"
                >
                    View
                </button>

            </td>

        `;


        table.appendChild(row);

    });

}


function viewEvent(eventId) {

    if (!eventId) {
        return;
    }


    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;

}


function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return "—";
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function normalizeStatus(status) {

    if (!status) {
        return "Pending";
    }


    return (
        status.charAt(0).toUpperCase() +
        status.slice(1).toLowerCase()
    );

}


function getEventCategory(event) {
    return event.category || "Other";
}


function getStatusClass(status) {

    switch (normalizeStatus(status)) {

        case "Approved":
            return "approved";

        case "Pending":
            return "pending";

        case "Rejected":
            return "rejected";

        case "Cancelled":
            return "cancelled";

        default:
            return "pending";

    }

}


function escapeHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}
