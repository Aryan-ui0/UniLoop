var items = JSON.parse(localStorage.getItem("uniloopItems"));

if (items == null) {
    items = [
        {
            name: "Badminton Racket",
            description: "Good condition racket",
            price: "₹30",
            icon: "🏸"
        },
        {
            name: "Iron",
            description: "Working electric iron",
            price: "₹20",
            icon: "🔌"
        },
        {
            name: "Wireless Mouse",
            description: "USB wireless mouse",
            price: "₹15",
            icon: "🖱️"
        }
    ];

    localStorage.setItem("uniloopItems", JSON.stringify(items));
}


var requests = JSON.parse(localStorage.getItem("uniloopRequests"));

if (requests == null) {
    requests = [];
}


showItems();
showRequests();
updateStats();


// =========================
// SHOW AVAILABLE ITEMS
// =========================

function showItems() {

    var container = document.getElementById("itemsContainer");

    container.innerHTML = "";

    for (var i = 0; i < items.length; i++) {

        var card = document.createElement("div");

        card.className = "item-card";


        card.innerHTML =
            "<div class='item-icon'>" + items[i].icon + "</div>" +
            "<h3>" + items[i].name + "</h3>" +
            "<p>" + items[i].description + "</p>" +
            "<p class='price'>" + items[i].price + " / day</p>";


        // REQUEST BUTTON

        var requestButton = document.createElement("button");

        requestButton.innerText = "Request Item";


        requestButton.onclick = function () {

            var itemName =
                this.parentElement.querySelector("h3").innerText;

            rentItem(itemName);
        };


        requestButton.className = "item-button";


        // DELETE BUTTON

        var deleteButton = document.createElement("button");

        deleteButton.innerText = "Delete";

        deleteButton.className = "delete-button";


        deleteButton.onclick = function () {

            var itemName =
                this.parentElement.querySelector("h3").innerText;

            deleteItem(itemName);
        };


        card.appendChild(requestButton);

        card.appendChild(deleteButton);

        container.appendChild(card);
    }
}


// =========================
// ADD ITEM
// =========================

function addItem() {

    var name =
        document.getElementById("itemName").value;

    var description =
        document.getElementById("itemDescription").value;

    var price =
        document.getElementById("itemPrice").value;


    if (name == "" || description == "" || price == "") {

        alert("Please fill all item details.");

        return;
    }


    var newItem = {

        name: name,

        description: description,

        price: "₹" + price,

        icon: "📦"
    };


    items.push(newItem);


    localStorage.setItem(
        "uniloopItems",
        JSON.stringify(items)
    );


    document.getElementById("itemName").value = "";

    document.getElementById("itemDescription").value = "";

    document.getElementById("itemPrice").value = "";


    showItems();

    updateStats();
}


// =========================
// DELETE ITEM
// =========================

function deleteItem(name) {

    items = items.filter(function (item) {

        return item.name != name;

    });


    localStorage.setItem(
        "uniloopItems",
        JSON.stringify(items)
    );


    showItems();

    updateStats();
}


// =========================
// REQUEST AN ITEM
// =========================

function rentItem(name) {

    document.getElementById("requestItem").value = name;


    document.getElementById("request").scrollIntoView({
        behavior: "smooth"
    });
}


// =========================
// SEND REQUEST
// =========================

function requestItem() {

    var item =
        document.getElementById("requestItem").value;

    var date =
        document.getElementById("requestDate").value;

    var days =
        document.getElementById("requestDays").value;


    if (item == "" || date == "" || days == "") {

        document.getElementById("requestMessage").innerText =
            "Please fill all request details.";

        return;
    }


    var newRequest = {

        item: item,

        date: date,

        days: days
    };


    requests.push(newRequest);


    localStorage.setItem(
        "uniloopRequests",
        JSON.stringify(requests)
    );


    document.getElementById("requestMessage").innerText =
        "Request sent successfully!";


    document.getElementById("requestItem").value = "";

    document.getElementById("requestDate").value = "";

    document.getElementById("requestDays").value = "";


    showRequests();

    updateStats();
}


// =========================
// SHOW REQUESTS
// =========================

function showRequests() {

    var container =
        document.getElementById("requestsContainer");


    container.innerHTML = "";


    if (requests.length == 0) {

        container.innerHTML =
            "<div class='item-card'>" +
            "<div class='item-icon'>📋</div>" +
            "<h3>No active requests</h3>" +
            "<p>Your requests will appear here.</p>" +
            "</div>";

        return;
    }


    for (var i = 0; i < requests.length; i++) {

        var card = document.createElement("div");

        card.className = "item-card";


        card.innerHTML =
            "<div class='item-icon'>📋</div>" +
            "<h3>" + requests[i].item + "</h3>" +
            "<p>Start Date: " + requests[i].date + "</p>" +
            "<p>Duration: " + requests[i].days + " day(s)</p>" +
            "<p class='price'>🟡 Pending</p>";


        // DELETE REQUEST BUTTON

        var deleteButton =
            document.createElement("button");

        deleteButton.innerText = "Delete";

        deleteButton.className = "delete-button";


        deleteButton.onclick = function () {

            var itemName =
                this.parentElement.querySelector("h3").innerText;

            deleteRequest(itemName);
        };


        card.appendChild(deleteButton);

        container.appendChild(card);
    }
}


// =========================
// DELETE REQUEST
// =========================

function deleteRequest(itemName) {

    requests = requests.filter(function (request) {

        return request.item != itemName;

    });


    localStorage.setItem(
        "uniloopRequests",
        JSON.stringify(requests)
    );


    showRequests();

    updateStats();
}


// =========================
// UPDATE STATS
// =========================

function updateStats() {

    document.getElementById("itemCount").innerText =
        items.length;


    document.getElementById("requestCount").innerText =
        requests.length;
}