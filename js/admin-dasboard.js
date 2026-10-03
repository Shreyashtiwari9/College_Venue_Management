function logout() {

    localStorage.removeItem("campusVenueUser");

    window.location.href = "../login.html";
}
