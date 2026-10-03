





function filterVenues() {

    const searchInput =
        document.getElementById("search");

    const filterSelect =
        document.getElementById("filter");


    const search =
        searchInput.value.toLowerCase().trim();

    const filter =
        filterSelect.value.toLowerCase();


    const venues =
        document.querySelectorAll(".venue");


    let visibleVenues = 0;


    venues.forEach(function (card) {


        

        const text =
            card.innerText.toLowerCase();


        

        const statusElement =
            card.querySelector(".status");


        const isStatusMatch =
            !filter ||
            statusElement.classList.contains(filter);


        

        const isSearchMatch =
            text.includes(search);


        

        if (
            isSearchMatch &&
            isStatusMatch
        ) {

            card.style.display = "";

            visibleVenues++;

        } else {

            card.style.display = "none";

        }

    });


    

    const noVenues =
        document.getElementById("noVenues");


    if (visibleVenues === 0) {

        noVenues.style.display = "block";

    } else {

        noVenues.style.display = "none";

    }

}




function manageVenue(name) {

    

    localStorage.setItem(
        "adminSelectedVenue",
        name
    );


    

    alert(
        name +
        " selected for management."
    );

}




function addVenue() {

    const name =
        prompt("Enter new venue name:");


    

    if (!name) {
        return;
    }


    const venueName =
        name.trim();


    if (venueName === "") {
        return;
    }


    

    alert(
        venueName +
        " will be added after backend integration."
    );

}




function logout() {

    localStorage.removeItem(
        "campusVenueUser"
    );


    window.location.href =
        "../login.html";

}




document.addEventListener(
    "DOMContentLoaded",
    function () {


        const search =
            document.getElementById("search");


        const filter =
            document.getElementById("filter");


        

        search.addEventListener(
            "input",
            filterVenues
        );


        

        filter.addEventListener(
            "change",
            filterVenues
        );

    }
);

