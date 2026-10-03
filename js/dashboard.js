document.addEventListener("DOMContentLoaded", function () {

    setupStudentNavigation();
    setupSidebar();
    setupLogout();
    setupDashboardSearch();
    setupTheme();

});


function setupStudentNavigation() {

    const navigation = {

        browseEventsBtn: "event.html",

        viewAllEvents: "event.html",

        viewVenuesBtn: "venues.html",

        checkEventsBtn: "event.html",

        quickEvents: "event.html",

        quickMyEvents: "my-events.html",

        quickVenues: "venues.html",

        quickNotifications: "notifications.html",

        notificationBtn: "notifications.html",

        profileBtn: "profile.html",

        profileMenuBtn: "profile.html"

    };


    Object.keys(navigation).forEach(function (id) {

        const element =
            document.getElementById(id);


        if (!element) {

            return;

        }


        element.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                const target =
                    navigation[id];


                window.location.href =
                    "/student/" + target;

            },
            true
        );

    });


    const sidebarLinks =
        document.querySelectorAll(
            ".sidebar-link"
        );


    sidebarLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const target =
                    link.getAttribute("href");


                if (
                    !target ||
                    target === "#"
                ) {

                    event.preventDefault();

                    return;

                }


                event.preventDefault();
                event.stopPropagation();


                window.location.href =
                    "/student/" + target;

            },
            true
        );

    });

}


function setupSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const menuBtn =
        document.querySelector(
            "#menuBtn, #mobileMenuBtn, [data-menu-toggle]"
        );


    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (
        menuBtn &&
        sidebar
    ) {

        menuBtn.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    if (
        overlay &&
        sidebar
    ) {

        overlay.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "open"
                );

            }
        );

    }


    const sidebarLinks =
        document.querySelectorAll(
            ".sidebar-link, .sidebar .nav-link"
        );


    sidebarLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                if (
                    window.innerWidth <= 900 &&
                    sidebar
                ) {

                    sidebar.classList.remove(
                        "open"
                    );

                }

            }
        );

    });

}


function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) {

        return;

    }


    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            if (typeof window.logoutUser === "function") {
                window.logoutUser();
                return;
            }

            localStorage.removeItem(
                "campusVenueToken"
            );


            localStorage.removeItem(
                "campusVenueUser"
            );


            localStorage.removeItem(
                "campusVenueRole"
            );


            localStorage.removeItem(
                "campusVenueRememberMe"
            );


            window.location.href =
                "/index.html";

        }
    );

}


function setupDashboardSearch() {

    const searchInput =
        document.getElementById(
            "dashboardSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            const value =
                searchInput.value
                    .toLowerCase()
                    .trim();


            const events =
                document.querySelectorAll(
                    ".dashboard-event"
                );


            events.forEach(function (event) {

                const text =
                    event.textContent
                        .toLowerCase();


                if (
                    !value ||
                    text.includes(value)
                ) {

                    event.style.display =
                        "";

                } else {

                    event.style.display =
                        "none";

                }

            });

        }
    );

}


function setupTheme() {

    const themeBtn =
        document.getElementById(
            "themeToggle"
        );


    const savedTheme =
        localStorage.getItem(
            "campusVenueTheme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode",
            "dark"
        );

    }


    if (!themeBtn) {

        return;

    }


    themeBtn.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-mode"
            );


            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );

            document.body.classList.toggle(
                "dark",
                isDark
            );


            localStorage.setItem(
                "campusVenueTheme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );

}