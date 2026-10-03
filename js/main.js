document.addEventListener("DOMContentLoaded", () => {

    const eventGrid = document.getElementById("homeEventsGrid");

    if (eventGrid) {
        eventGrid.innerHTML = renderHomepageEmpty("Loading events...");
    }

    document.querySelectorAll(".venue-category-grid").forEach(grid => {
        grid.innerHTML = renderHomepageEmpty("Loading venues...");
    });

    loadHomepageData();

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", () => {

            navLinks.classList.toggle("open");

            const icon = menuBtn.querySelector("i");

            if (icon) {

                if (navLinks.classList.contains("open")) {
                    icon.classList.remove("bi-list");
                    icon.classList.add("bi-x");
                } else {
                    icon.classList.remove("bi-x");
                    icon.classList.add("bi-list");
                }

            }

        });


        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("open");

                const icon = menuBtn.querySelector("i");

                if (icon) {
                    icon.classList.remove("bi-x");
                    icon.classList.add("bi-list");
                }

            });

        });

    }


    const themeBtn = document.getElementById("themeBtn");

    const savedTheme =
        localStorage.getItem("campusVenueTheme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");
        document.body.classList.add("dark-mode");

        if (themeBtn) {
            themeBtn.innerHTML =
                '<i class="bi bi-sun"></i>';
        }

    }


    if (themeBtn) {

        themeBtn.addEventListener("click", () => {

            document.body.classList.toggle("dark");

            const isDark =
                document.body.classList.contains("dark");

            document.body.classList.toggle("dark-mode", isDark);

            localStorage.setItem(
                "campusVenueTheme",
                isDark ? "dark" : "light"
            );

            themeBtn.innerHTML = isDark
                ? '<i class="bi bi-sun"></i>'
                : '<i class="bi bi-moon-stars"></i>';

        });

    }


    const sections =
        document.querySelectorAll("section[id]");

    const navItems =
        document.querySelectorAll(".nav-links > a");


    window.addEventListener("scroll", () => {

        let current = "";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 150;

            if (window.scrollY >= sectionTop) {
                current =
                    section.getAttribute("id");
            }

        });


        navItems.forEach(item => {

            item.classList.remove("active");

            const href =
                item.getAttribute("href");

            if (href === `#${current}`) {
                item.classList.add("active");
            }

        });

    });


    document.addEventListener(
        "click",
        function (event) {

            const favoriteButton =
                event.target.closest(".favorite-btn");

            if (favoriteButton) {

                toggleHomepageFavorite(
                    favoriteButton
                );

                return;
            }


            const detailsButton =
                event.target.closest(".details-btn");

            if (detailsButton) {

                event.preventDefault();

                handleProtectedNavigation();

                return;
            }


            const venueButton =
                event.target.closest(".venue-arrow");

            if (venueButton) {

                event.preventDefault();

                handleProtectedNavigation();

                return;
            }

            const protectedLink =
                event.target.closest(".auth-required");

            if (protectedLink && protectedLink.dataset.target) {
                event.preventDefault();

                handleProtectedNavigation();
            }

        }
    );


    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(anchor => {

        anchor.addEventListener(
            "click",
            function (event) {

                const targetId =
                    this.getAttribute("href");

                if (
                    targetId === "#" ||
                    targetId.length <= 1
                ) {
                    return;
                }

                const target =
                    document.querySelector(targetId);

                if (!target) {
                    return;
                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });


    const toast =
        document.getElementById("toast");

    const closeToast =
        document.getElementById("closeToast");


    if (closeToast && toast) {

        closeToast.addEventListener(
            "click",
            () => {

                toast.classList.remove("show");

            }
        );

    }


    window.showToast =
        function (message) {

            if (!toast) {
                return;
            }

            const messageElement =
                document.getElementById(
                    "toastMessage"
                );

            if (messageElement) {
                messageElement.textContent =
                    message;
            }

            toast.classList.add("show");

            clearTimeout(
                window.toastTimer
            );

            window.toastTimer =
                setTimeout(() => {

                    toast.classList.remove(
                        "show"
                    );

                }, 3500);

        };

    ["googleAuthBtn", "facebookAuthBtn"].forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener("click", () => {
                const provider = id === "googleAuthBtn" ? "Google" : "Facebook";
                window.showToast(`${provider} sign-in is not connected yet.`);
            });
        }
    });


    const buttons =
        document.querySelectorAll(
            ".primary-btn, .secondary-btn, .register-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                this.style.transform =
                    "scale(0.97)";

                setTimeout(() => {

                    this.style.transform = "";

                }, 120);

            }
        );

    });


    const animatedElements =
        document.querySelectorAll(
            ".event-card, .venue-card, .feature-card, .stat-card"
        );


    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.style.opacity =
                                "1";

                            entry.target.style.transform =
                                "translateY(0)";

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );


        animatedElements.forEach(element => {

            element.style.opacity = "0";

            element.style.transform =
                "translateY(25px)";

            element.style.transition =
                "opacity 0.6s ease, transform 0.6s ease";

            observer.observe(element);

        });

    }


    console.log(
        "CampusVenue Frontend initialized successfully."
    );

});


const HOME_API_BASE_URL =
    "/api";


async function loadHomepageData() {

    await Promise.all([
        loadHomepageStats(),
        loadHomepageEvents(),
        loadHomepageVenues()
    ]);

}


async function loadHomepageStats() {

    try {

        const response =
            await fetch(
                `${HOME_API_BASE_URL}/public/stats`
            );

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load statistics."
            );

        }


        setHomepageText(
            "homeEventsCount",
            formatCount(data.stats.events)
        );

        setHomepageText(
            "heroEventCount",
            formatCount(data.stats.events)
        );


        setHomepageText(
            "homeVenuesCount",
            formatCount(data.stats.venues)
        );

        setHomepageText(
            "heroVenueCount",
            formatCount(data.stats.venues)
        );


        setHomepageText(
            "homeStudentsCount",
            formatCount(data.stats.students)
        );

        setHomepageText(
            "heroParticipantCount",
            formatCount(data.stats.participants)
        );


        setHomepageText(
            "homeSuccessRate",
            `${data.stats.successRate}%`
        );

        const featuredEvent = data.stats.featuredEvent;

        setHomepageText(
            "heroFeaturedTitle",
            featuredEvent?.title || "No upcoming approved events"
        );

        setHomepageText(
            "heroFeaturedDate",
            featuredEvent
                ? `${new Date(featuredEvent.eventDate).toLocaleDateString("en-IN")} · ${featuredEvent.venue?.name || "Venue not assigned"}`
                : ""
        );

        setHomepageText(
            "heroFeaturedStatus",
            featuredEvent ? "Approved" : ""
        );


    } catch (error) {

        console.error(
            "Homepage Stats Error:",
            error
        );

        [
            "homeEventsCount",
            "homeVenuesCount",
            "homeStudentsCount",
            "homeSuccessRate",
            "heroEventCount",
            "heroVenueCount",
            "heroParticipantCount"
        ].forEach(id => setHomepageText(id, "Unavailable"));

        setHomepageText("heroFeaturedTitle", "Unable to load upcoming events");
        setHomepageText("heroFeaturedDate", "");
        setHomepageText("heroFeaturedStatus", "");

    }

}


async function loadHomepageEvents() {

    const grid =
        document.querySelector(
            "#events .event-grid"
        );


    if (!grid) {
        return;
    }


    try {

        const response =
            await fetch(
                `${HOME_API_BASE_URL}/events`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load events."
            );

        }


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const events =
            (
                Array.isArray(data.events)
                    ? data.events
                    : []
            )
                .filter(function (event) {

                    const date =
                        new Date(event.eventDate);

                    return (
                        event.status === "approved" &&
                        date >= today
                    );

                })
                .slice(0, 3);


        grid.innerHTML =
            events.length
                ? events
                    .map(renderHomepageEvent)
                    .join("")
                : renderHomepageEmpty(
                    "No approved upcoming events are available."
                );


    } catch (error) {

        console.error(
            "Homepage Events Error:",
            error
        );


        grid.innerHTML =
            renderHomepageEmpty(
                "Events are temporarily unavailable."
            );

    }

}


async function loadHomepageVenues() {

    const grid =
        document.querySelector(
            "#homeVenuesGrid"
        );


    if (!grid) {
        return;
    }


    try {

        const response =
            await fetch(
                `${HOME_API_BASE_URL}/venues`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load venues."
            );

        }


        const venues = Array.isArray(data.venues)
            ? data.venues.slice(0, 12)
            : [];
        const groups = {
            auditorium: [],
            seminar: [],
            laboratories: []
        };

        venues.forEach((venue, index) => {
            const category = getHomepageVenueCategory(venue.name);

            if (category) {
                groups[category].push({ venue, index });
            }
        });

        [
            ["auditoriumVenueGrid", groups.auditorium],
            ["seminarVenueGrid", groups.seminar],
            ["laboratoryVenueGrid", groups.laboratories]
        ].forEach(([gridId, group]) => {
            const categoryGrid = document.getElementById(gridId);

            if (categoryGrid) {
                categoryGrid.innerHTML = group.length
                    ? group
                        .map(({ venue, index }) => renderHomepageVenue(venue, index))
                        .join("")
                    : renderHomepageEmpty("No venues in this category yet.");
            }
        });


    } catch (error) {

        console.error(
            "Homepage Venues Error:",
            error
        );


        document.querySelectorAll(".venue-category-grid").forEach(categoryGrid => {
            categoryGrid.innerHTML = renderHomepageEmpty(
                "Venues are temporarily unavailable."
            );
        });

    }

}


function renderHomepageEvent(event, index) {

    const date =
        new Date(event.eventDate);

    const venue =
        event.venue || {};

    const imageClass = event.category === "Technical"
        ? "tech"
        : event.category === "Workshop" || event.category === "Seminar"
            ? "workshop"
            : "cultural";


    return `
        <article class="event-card">

            <div class="event-image ${imageClass}">

                <span class="event-category">
                    ${escapeHomepageHTML(event.category || "Event")}
                </span>

                <button
                    class="favorite-btn"
                    type="button"
                    aria-label="Add event to favorites"
                >
                    <i class="bi bi-heart"></i>
                </button>

                <div class="event-date">

                    <strong>
                        ${escapeHomepageHTML(
                            date.getDate()
                        )}
                    </strong>

                    <span>
                        ${escapeHomepageHTML(
                            date
                                .toLocaleDateString(
                                    "en-IN",
                                    {
                                        month: "short"
                                    }
                                )
                                .toUpperCase()
                        )}
                    </span>

                </div>

            </div>


            <div class="event-body">

                <h3>
                    ${escapeHomepageHTML(
                        event.title ||
                        "Untitled Event"
                    )}
                </h3>


                <p>
                    ${escapeHomepageHTML(
                        event.description ||
                        "No description available."
                    )}
                </p>


                <div class="event-meta">

                    <span>

                        <i class="bi bi-geo-alt"></i>

                        ${escapeHomepageHTML(
                            venue.name ||
                            "Venue not assigned"
                        )}

                    </span>


                    <span>

                        <i class="bi bi-clock"></i>

                        ${escapeHomepageHTML(
                            formatHomepageTime(
                                event.startTime
                            )
                        )}

                    </span>

                </div>


                <div class="event-footer">

                    <span class="participants">

                        <i class="bi bi-people"></i>

                        ${escapeHomepageHTML(
                            String(
                                event.expectedParticipants ||
                                0
                            )
                        )}

                        Expected

                    </span>


                    <a
                        class="details-btn auth-required"
                        href="login.html"
                        data-event-id="${escapeHomepageHTML(
                            event._id
                        )}"
                    >

                        Details

                        <i class="bi bi-arrow-up-right"></i>

                    </a>

                </div>

            </div>

        </article>
    `;

}


function getHomepageVenueCategory(name) {
    const normalizedName = String(name || "").trim().toLowerCase();

    if (/^lab\s*[1-6]\b/.test(normalizedName)) {
        return "laboratories";
    }

    if (normalizedName.includes("chanakya") || normalizedName.includes("chaanakya")) {
        return "auditorium";
    }

    if (
        normalizedName.includes("new seminar") ||
        normalizedName.includes("old seminar") ||
        normalizedName.includes("dronacharya")
    ) {
        return "seminar";
    }

    return null;
}


function renderHomepageVenue(venue, index) {
    const venueName = String(venue.name || "Campus Venue");
    const normalizedName = venueName.toLowerCase();
    const category = getHomepageVenueCategory(venueName);
    const visualClass = category === "auditorium"
        ? "chanakya"
        : category === "laboratories"
            ? "lab"
            : normalizedName.includes("new seminar")
                ? "new-seminar"
                : normalizedName.includes("old seminar")
                    ? "old-seminar"
                    : "dronacharya";
    const status = String(venue.availability || venue.status || "unavailable").toLowerCase();
    const statusLabel = status === "available" ? "Available" : status;
    const venueType = category === "auditorium"
        ? "AUDITORIUM"
        : category === "laboratories"
            ? "LABORATORY"
            : normalizedName.includes("dronacharya")
                ? "CLASSROOM"
                : "SEMINAR HALL";
    const labType = category === "laboratories"
        ? /^lab\s*[12]\b/.test(normalizedName)
            ? "UG Lab"
            : "PG Lab"
        : "";
    const typeText = labType ? `${venueType} • ${labType}` : venueType;

    return `
        <article class="venue-card ${category === "auditorium" ? "large" : ""}">
            <div class="venue-visual ${visualClass}">
                <div class="venue-overlay">
                    <span class="${status === "available" ? "available" : "busy"}">
                        <i class="bi bi-circle-fill"></i>
                        ${escapeHomepageHTML(statusLabel)}
                    </span>
                    <a class="venue-arrow auth-required" href="login.html" data-target="venues" data-venue-id="${escapeHomepageHTML(venue._id)}" aria-label="View venue details">
                        <i class="bi bi-arrow-up-right"></i>
                    </a>
                </div>
            </div>
            <div class="venue-info">
                <div>
                    <span class="venue-type">${escapeHomepageHTML(typeText)}</span>
                    <h3>${escapeHomepageHTML(venueName)}</h3>
                    <p><i class="bi bi-people"></i> Capacity: ${escapeHomepageHTML(String(venue.capacity || 0))} people</p>
                </div>
                ${labType ? `
                    <div class="facility-list">
                        <span><i class="bi bi-pc-display"></i> ${escapeHomepageHTML(labType)}</span>
                        <span><i class="bi bi-wifi"></i> Lab Facility</span>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}


function renderHomepageEmpty(message) {
    return `
        <div class="homepage-empty">
            ${escapeHomepageHTML(message)}
        </div>
    `;
}


function toggleHomepageFavorite(button) {
    button.classList.toggle("active");

    const icon = button.querySelector("i");

    if (!icon) {
        return;
    }

    if (button.classList.contains("active")) {
        icon.classList.remove("bi-heart");
        icon.classList.add("bi-heart-fill");
        window.showToast?.("Added to wishlist.");
    } else {
        icon.classList.remove("bi-heart-fill");
        icon.classList.add("bi-heart");
        window.showToast?.("Removed from wishlist.");
    }
}


function handleProtectedNavigation() {
    window.location.href = "login.html";
}


function showAuthNotification() {

    const overlay =
        document.getElementById(
            "authNotification"
        );


    if (!overlay) {

        window.location.href =
            "register.html";

        return;
    }


    overlay.classList.add("show");

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    const closeButton =
        document.getElementById(
            "closeAuthNotification"
        );


    if (closeButton) {

        closeButton.focus();

    }

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.getElementById(
                "closeAuthNotification"
            );


        const overlay =
            document.getElementById(
                "authNotification"
            );


        if (closeButton && overlay) {

            closeButton.addEventListener(
                "click",
                () => {

                    overlay.classList.remove(
                        "show"
                    );

                    overlay.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }
            );


            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {

                        overlay.classList.remove(
                            "show"
                        );

                        overlay.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                    }

                }
            );

        }

    }
);


function setHomepageText(
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


function formatCount(value) {

    const count =
        Number(value) || 0;


    return count >= 1000
        ? `${(count / 1000).toFixed(1)}K+`
        : String(count);

}


function formatHomepageTime(value) {

    if (!value) {
        return "Time not available";
    }


    const [
        hours,
        minutes
    ] =
        String(value).split(":");


    const date =
        new Date(
            2000,
            0,
            1,
            Number(hours),
            Number(minutes || 0)
        );


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function escapeHomepageHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


