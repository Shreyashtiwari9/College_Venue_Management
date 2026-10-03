function updateStats() {

    const rows =
        document.querySelectorAll(
            "#studentTable tr"
        );


    let present = 0;
    let absent = 0;


    rows.forEach(row => {

        const status =
            row.children[3]
                .innerText
                .trim();


        if (status === "Present") {

            present++;

        } else {

            absent++;
        }
    });


    const total =
        present + absent;


    document.getElementById("total")
        .innerText = total;


    document.getElementById("present")
        .innerText = present;


    document.getElementById("absent")
        .innerText = absent;


    const percentage =
        total
            ? Math.round(
                (present / total) * 100
            )
            : 0;


    document.getElementById("percentage")
        .innerText = percentage + "%";
}


function toggleAttendance(button) {

    const row =
        button.closest("tr");


    const status =
        row.children[3];


    if (status.innerText === "Present") {

        status.innerText = "Absent";

        status.className = "absent";

        button.innerText =
            "Mark Present";

    } else {

        status.innerText = "Present";

        status.className = "present";

        button.innerText =
            "Mark Absent";
    }


    updateStats();
}


function markAllPresent() {

    document
        .querySelectorAll("#studentTable tr")
        .forEach(row => {

            row.children[3].innerText =
                "Present";

            row.children[3].className =
                "present";


            row.children[4]
                .querySelector("button")
                .innerText =
                "Mark Absent";
        });


    updateStats();
}


function filterStudents() {

    const search =
        document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();


    document
        .querySelectorAll("#studentTable tr")
        .forEach(row => {

            const text =
                row.innerText.toLowerCase();


            row.style.display =
                text.includes(search)
                    ? ""
                    : "none";
        });
}


function loadAttendance() {

    updateStats();
}


function logout() {

    localStorage.removeItem("campusVenueUser");

    window.location.href =
        "../login.html";
}


updateStats();