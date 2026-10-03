(function () {
    const hostname = window.location.hostname;
    const isLocalFile = window.location.protocol === "file:";
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
    let backendOrigin = window.location.origin;

    const usesLocalBackendPort =
        window.location.port === "5000" ||
        window.location.port === "5001";

    if (isLocalFile || (isLocalHost && !usesLocalBackendPort)) {
        backendOrigin = hostname === "127.0.0.1"
            ? "http://127.0.0.1:5000"
            : "http://localhost:5000";
    }

    window.CAMPUS_VENUE_API_BASE_URL = `${backendOrigin}/api`;

    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input, options) {
        if (typeof input === "string" && input.startsWith("/api/")) {
            input = `${window.CAMPUS_VENUE_API_BASE_URL}${input.slice(4)}`;
        }
        return originalFetch(input, options);
    };
})();
