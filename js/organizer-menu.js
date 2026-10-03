"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("organizerMenuToggle");
    const navLinks = document.getElementById("organizerNavLinks");

    if (!menuToggle || !navLinks) {
        return;
    }

    function setMenuOpen(isOpen) {
        navLinks.classList.toggle("open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );

        const icon = menuToggle.querySelector("span");
        if (icon) {
            icon.textContent = isOpen ? "\u00d7" : "\u2630";
        }
    }

    menuToggle.addEventListener("click", function () {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            setMenuOpen(false);
        });
    });
});