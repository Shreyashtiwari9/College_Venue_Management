const STUDENT_VENUE_API_URL = "/api";

document.addEventListener("DOMContentLoaded", function () {
    loadStudentVenues();
    setupVenueNavigation();
});

async function loadStudentVenues() {
    const loading = document.getElementById("venueLoading");
    const errorBox = document.getElementById("venueError");
    const grid = document.getElementById("venueGrid");

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
        errorBox.textContent = "";
    }

    try {
        const response = await fetch(
            `${STUDENT_VENUE_API_URL}/venues`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load venues."
            );
        }

        const venues = Array.isArray(data.venues)
            ? data.venues
            : [];

        renderStudentVenues(venues);

    } catch (error) {
        console.error(
            "Student Venue Load Error:",
            error
        );

        if (errorBox) {
            errorBox.textContent =
                error.message ||
                "Unable to load venues.";

            errorBox.style.display = "block";
        }

        if (grid) {
            grid.innerHTML = "";
        }

    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}

function renderStudentVenues(venues) {
    const grid = document.getElementById("venueGrid");
    const empty = document.getElementById("noVenues");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (!venues.length) {
        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    venues.forEach(function (venue) {
        const card = document.createElement("article");

        const status =
            venue.availability || venue.status || "unavailable";

        const statusClass = String(status)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");

        const name = venue.name || "Unnamed venue";
        const location = venue.location || "Campus venue";
        const type = venue.type || "Campus Venue";
        const capacity = venue.capacity || "Not listed";
        const description = venue.description || "";
        const isLabVenue = /\b(lab|laboratory|computer)\b/i.test(`${name} ${type}`);
        const venueImage = isLabVenue
            ? "../assets/5f16101f-a453-4e5b-89b0-8ef48e228404.png"
            : venue.image || "";

        const facilities = Array.isArray(venue.facilities)
            ? venue.facilities
            : [];

        const facilityMarkup = facilities.length
            ? facilities.slice(0, 3).map(function (facility) {
                return `<span class="facility">${escapeVenueText(facility)}</span>`;
            }).join("") + (facilities.length > 3
                ? `<span class="facility">+${facilities.length - 3} more</span>`
                : "")
            : `<span class="facility">No facilities listed</span>`;

        const fallbackIcon = getVenueFallbackIcon(name, type);

        const venueId =
            venue._id || venue.id || "";

        card.className = "venue-card";

        card.innerHTML = `
            <div class="venue-image">
                ${venueImage
                    ? ""
                    : `<span class="venue-fallback" aria-hidden="true">${fallbackIcon}</span>`}
                ${venueImage
                    ? `<img class="venue-photo" src="${escapeVenueText(venueImage)}" alt="${escapeVenueText(name)}">`
                    : ""}
                <span class="venue-type">${escapeVenueText(type)}</span>
                <span class="availability ${escapeVenueText(statusClass)}">${escapeVenueText(formatVenueStatus(status))}</span>
            </div>

            <div class="venue-body">
                <h3>${escapeVenueText(name)}</h3>

                <p class="location">
                    <span aria-hidden="true">&#128205;</span>
                    <span>${escapeVenueText(location)}</span>
                </p>

                <div class="venue-meta">
                    <div class="meta-item">
                        <span>Capacity</span>
                        <strong>${escapeVenueText(String(capacity))} seats</strong>
                    </div>
                    <div class="meta-item">
                        <span>Facilities</span>
                        <strong>${facilities.length}</strong>
                    </div>
                </div>

                ${description
                    ? `<p class="venue-description">${escapeVenueText(description)}</p>`
                    : ""}

                <div class="facilities">${facilityMarkup}</div>

                <a
                    class="view-btn nav-link venue-details-link"
                    href="/student/venue-details.html?id=${encodeURIComponent(venueId)}">
                    View venue details
                </a>
            </div>
        `;

        const venuePhoto = card.querySelector(".venue-photo");
        if (venuePhoto) {
            venuePhoto.addEventListener("error", function () {
                venuePhoto.hidden = true;
            });
        }

        grid.appendChild(card);
    });
}

function getVenueFallbackIcon(name, type) {
    const venueLabel = `${name} ${type}`.toLowerCase();

    if (/sport|ground|stadium/.test(venueLabel)) {
        return "&#127967;";
    }

    if (/lab|science/.test(venueLabel)) {
        return "&#129514;";
    }

    if (/classroom|lecture/.test(venueLabel)) {
        return "&#127979;";
    }

    return "&#127963;";
}

function setupVenueNavigation() {
    const links =
        document.querySelectorAll(
            ".venues-screen .nav-link"
        );

    links.forEach(function (link) {
        link.addEventListener(
            "click",
            function (event) {
                const href =
                    link.getAttribute("href");

                if (!href || href === "#") {
                    return;
                }

                if (
                    link.classList.contains(
                        "venue-details-link"
                    )
                ) {
                    event.preventDefault();

                    window.location.href =
                        href;

                    return;
                }

                if (
                    href === "dashboard.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/dashboard.html";

                    return;
                }

                if (
                    href === "events.html" ||
                    href === "event.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/events.html";

                    return;
                }

                if (
                    href === "venues.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/venues.html";

                    return;
                }

                if (
                    href === "my-events.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/my-events.html";

                    return;
                }

                if (
                    href === "notifications.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/notifications.html";

                    return;
                }

                if (
                    href === "profile.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/student/profile.html";

                    return;
                }

                if (
                    href === "../index.html"
                ) {
                    event.preventDefault();

                    window.location.href =
                        "/index.html";
                }
            },
            true
        );
    });
}

function formatVenueStatus(status) {
    const value =
        String(status)
            .toLowerCase()
            .trim();

    if (value === "available") {
        return "Available";
    }

    if (value === "occupied") {
        return "Occupied";
    }

    if (value === "maintenance") {
        return "Under Maintenance";
    }

    return status;
}

function escapeVenueText(value) {
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
