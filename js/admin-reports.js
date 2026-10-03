document.addEventListener("DOMContentLoaded", function () {
    loadReports();
});


async function loadReports() {

    console.log("Admin Reports JS loaded.");

    try {

        const token =
            localStorage.getItem(
                "campusVenueToken"
            );


        console.log(
            "CampusVenue Token:",
            token ? "Found" : "Not Found"
        );


        if (!token) {

            showReportError(
                "Authentication required. Please login again."
            );

            return;
        }


        const response =
            await fetch(
                "/api/events/reports",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Reports API Status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Reports API Response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load reports"
            );

        }


        const reports =
            data.reports;


        updateSummaryCards(
            reports
        );


        updateVenueReports(
            reports
        );


        updateCategoryReports(
            reports
        );


        updateReportBars();


    } catch (error) {

        console.error(
            "Reports Error:",
            error
        );


        showReportError(
            error.message ||
            "Unable to load reports from the server."
        );

    }

}


function updateSummaryCards(reports) {

    const statCards =
        document.querySelectorAll(
            ".stats .stat"
        );


    if (!statCards.length) {
        return;
    }


    updateStatCard(
        statCards[0],
        formatNumber(
            reports.totalEvents
        ),
        "Events recorded in the database"
    );


    updateStatCard(
        statCards[1],
        formatNumber(
            reports.totalParticipants
        ),
        "Expected participants"
    );


    updateStatCard(
        statCards[2],
        formatNumber(
            reports.venueBookings
        ),
        "Approved venue bookings"
    );


    updateStatCard(
        statCards[3],
        `${Number(reports.attendance?.rate) || 0}%`,
        `${formatNumber(reports.attendance?.presentCount)} present of ${formatNumber(reports.attendance?.markedCount)} marked`
    );

}


function updateStatCard(
    card,
    value,
    description
) {

    if (!card) {
        return;
    }


    const number =
        card.querySelector(
            ".number"
        );


    if (number) {
        number.textContent =
            value;
    }


    const paragraph =
        card.querySelector(
            "p"
        );


    if (paragraph) {
        paragraph.textContent =
            description;
    }

}


function updateCategoryReports(reports) {

    const reportCards =
        document.querySelectorAll(
            ".reports .report"
        );


    if (!reportCards.length) {
        return;
    }


    const categoryReport =
        reportCards[0];


    const heading =
        categoryReport.querySelector(
            "h2"
        );


    if (heading) {
        heading.textContent =
            "Event Categories";
    }


    const bars =
        categoryReport.querySelectorAll(
            ".bar"
        );

    const categoryUsage = Array.isArray(reports.categoryUsage)
        ? reports.categoryUsage
        : [];

    const maximumCount = Math.max(
        0,
        ...categoryUsage.map(item => Number(item.count) || 0)
    );

    bars.forEach(function (bar, index) {
        const item = categoryUsage[index];
        const label = bar.querySelector(".bar-top span");
        const value = bar.querySelector(".bar-top strong");
        const fill = bar.querySelector(".fill");
        const count = Number(item?.count) || 0;

        if (label) {
            label.textContent = item?.category || "No category data";
        }

        if (value) {
            value.textContent = formatNumber(count);
        }

        if (fill) {
            const percentage = maximumCount > 0
                ? Math.round((count / maximumCount) * 100)
                : 0;
            fill.dataset.width = percentage;
            fill.style.width = `${percentage}%`;
        }
    });

    const message = categoryReport.querySelector(".report-data-message");

    if (!categoryUsage.length) {
        const emptyMessage = message || document.createElement("p");
        emptyMessage.className = "report-data-message";
        emptyMessage.textContent = "No event category data found.";

        if (!message) {
            categoryReport.appendChild(emptyMessage);
        }
    } else {
        message?.remove();
    }

}


function updateVenueReports(reports) {

    const reportCards =
        document.querySelectorAll(
            ".reports .report"
        );


    if (reportCards.length < 2) {
        return;
    }


    const venueReport =
        reportCards[1];


    const heading =
        venueReport.querySelector(
            "h2"
        );


    if (heading) {
        heading.textContent =
            "Most Used Venues";
    }


    const bars =
        venueReport.querySelectorAll(
            ".bar"
        );


    const venueUsage =
        Array.isArray(
            reports.venueUsage
        )
            ? reports.venueUsage
            : [];


    if (!venueUsage.length) {

        bars.forEach(
            function (bar) {

                const label =
                    bar.querySelector(
                        ".bar-top span"
                    );


                const value =
                    bar.querySelector(
                        ".bar-top strong"
                    );


                const fill =
                    bar.querySelector(
                        ".fill"
                    );


                if (label) {
                    label.textContent =
                        "No bookings";
                }


                if (value) {
                    value.textContent =
                        "0";
                }


                if (fill) {
                    fill.style.width =
                        "0%";
                }

            }
        );


        return;
    }


    const maximumBookings =
        Math.max(
            ...venueUsage.map(
                function (venue) {

                    return Number(
                        venue.bookings
                    ) || 0;

                }
            )
        );


    bars.forEach(
        function (bar, index) {

            const label =
                bar.querySelector(
                    ".bar-top span"
                );


            const value =
                bar.querySelector(
                    ".bar-top strong"
                );


            const fill =
                bar.querySelector(
                    ".fill"
                );


            const venue =
                venueUsage[index];


            if (!venue) {

                if (label) {
                    label.textContent =
                        "No additional venue";
                }


                if (value) {
                    value.textContent =
                        "0";
                }


                if (fill) {
                    fill.style.width =
                        "0%";
                }


                return;
            }


            const bookings =
                Number(
                    venue.bookings
                ) || 0;


            const percentage =
                maximumBookings > 0
                    ? Math.round(
                        (
                            bookings /
                            maximumBookings
                        ) * 100
                    )
                    : 0;


            if (label) {
                label.textContent =
                    venue.name ||
                    "Unknown Venue";
            }


            if (value) {
                value.textContent =
                    `${bookings} booking${
                        bookings === 1
                            ? ""
                            : "s"
                    }`;
            }


            if (fill) {

                fill.dataset.width =
                    percentage;

                fill.style.width =
                    `${percentage}%`;

            }

        }
    );

}


function updateReportBars() {

    const fills =
        document.querySelectorAll(
            ".fill[data-width]"
        );


    fills.forEach(
        function (fill) {

            const width =
                Number(
                    fill.dataset.width
                );


            if (
                Number.isFinite(width) &&
                width >= 0
            ) {

                fill.style.width =
                    `${Math.min(
                        width,
                        100
                    )}%`;

            }

        }
    );

}


function formatNumber(value) {

    return new Intl.NumberFormat(
        "en-IN"
    ).format(
        Number(value) || 0
    );

}


function showReportError(message) {

    let errorBox =
        document.querySelector(
            ".reports-error-message"
        );


    if (!errorBox) {

        errorBox =
            document.createElement(
                "div"
            );


        errorBox.className =
            "reports-error-message";


        errorBox.style.marginTop =
            "20px";


        errorBox.style.padding =
            "14px 16px";


        errorBox.style.border =
            "1px solid #fecaca";


        errorBox.style.borderRadius =
            "10px";


        errorBox.style.background =
            "#fef2f2";


        errorBox.style.color =
            "#b91c1c";


        errorBox.style.fontSize =
            "14px";


        const main =
            document.querySelector(
                "main"
            );


        if (main) {
            main.prepend(
                errorBox
            );
        }

    }


    errorBox.textContent =
        message;

}


async function downloadReport() {

    try {

        const token =
            localStorage.getItem(
                "campusVenueToken"
            );


        if (!token) {

            alert(
                "Please login again."
            );

            return;
        }


        const response =
            await fetch(
                "/api/events/reports",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to generate report"
            );

        }


        const reports =
            data.reports;


        const reportText = `
CAMPUSVENUE
REPORTS & ANALYTICS
========================================

SUMMARY

Total Events:
${reports.totalEvents}

Total Expected Participants:
${reports.totalParticipants}

Student Registrations:
${reports.totalRegistrations}

Approved Venue Bookings:
${reports.venueBookings}

Approved Events:
${reports.approvedEvents}

Pending Events:
${reports.pendingEvents}

Rejected Events:
${reports.rejectedEvents}

Cancelled Events:
${reports.cancelledEvents}


MOST USED VENUES
========================================

${generateVenueReportText(
    reports.venueUsage
)}


ATTENDANCE
========================================

Present: ${reports.attendance?.presentCount || 0}
Absent: ${reports.attendance?.absentCount || 0}
Attendance Rate: ${reports.attendance?.rate || 0}%


EVENT CATEGORIES
========================================

${(reports.categoryUsage || []).map(item => `${item.category}: ${item.count}`).join("\n") || "No event category data found."}


Generated:
${new Date().toLocaleString(
    "en-IN"
)}
`;


        const blob =
            new Blob(
                [reportText],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `CampusVenue_Report_${getDateForFile()}.txt`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(
            "Generate Report Error:",
            error
        );


        alert(
            error.message ||
            "Failed to generate report."
        );

    }

}


function generateVenueReportText(
    venueUsage
) {

    if (
        !Array.isArray(
            venueUsage
        ) ||
        !venueUsage.length
    ) {

        return "No venue booking data available.";

    }


    return venueUsage
        .map(
            function (
                venue,
                index
            ) {

                return `${index + 1}. ${
                    venue.name ||
                    "Unknown Venue"
                } - ${
                    Number(
                        venue.bookings
                    ) || 0
                } booking(s)`;

            }
        )
        .join(
            "\n"
        );

}


function getDateForFile() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}