/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
let map;

    //  requestUnicorn
    //      make the POST request to the server
    function requestUnicorn(pickupLocation) {
    $.ajax({
        method: 'POST',
        url: _config.api.invokeUrl + '/ride',
        data: JSON.stringify({
            PickupLocation: {
                Latitude: pickupLocation.latitude,
                Longitude: pickupLocation.longitude
            }
            }),
            contentType: 'application/json',
            success: result => completeRequest(result, pickupLocation),
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    //  completeRequest
    //      a Unicorn has been dispatched to your location
    function completeRequest(result, pickupLocation) {
        var unicorn;
        var pronoun;

        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.', unicorn.Color);

        console.log(pickupLocation);
        //  get the local weather, find nearby restaurants, movies
        //let searchText = document.getElementById('search').value;
       // if (searchText.length === 0)
           // getWeather(pickupLocation, unicorn)
           // bookSearch(searchText);

        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' has arrived. Giddy up!', unicorn.Color);
            WildRydes.map.unsetLocation();

            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }

        window.navigator.geolocation
            .getCurrentPosition(setLocation);

        //  put the map behind the updates list
        document.getElementById("map").style.zIndex = "10";

        function setLocation(loc) {
            map = L.map('map').setView([loc.coords.latitude, loc.coords.longitude], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            WildRydes.map.center = {latitude: loc.coords.latitude, longitude: loc.coords.longitude};
            let b = map.getBounds();        //  TODO moved
            WildRydes.map.extent = {minLat: b._northEast.lat, minLng: b._northEast.lng,
                maxLat: b._southWest.lat, maxLng: b._southWest.lng};

            WildRydes.marker  = L.marker([loc.coords.latitude, loc.coords.longitude]).addTo(map);
            var myIcon = L.icon({
                iconUrl: 'images/unicorn-icon.png',
                iconSize: [25, 25],
                iconAnchor: [22, 24],
                shadowSize: [25, 25],
                shadowAnchor: [22, 24]
            });
            WildRydes.unicorn = L.marker([loc.coords.latitude, loc.coords.longitude], {icon: myIcon}).addTo(map);
            // WildRydes.marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();

            // var popup = L.popup();
            map.on('click', onMapClick);

            function onMapClick(e) {            //  TODO move to esri.js
                WildRydes.map.selectedPoint = {longitude: e.latlng.lng, latitude: e.latlng.lat};
                if (WildRydes.marker)       WildRydes.marker.remove();
                handlePickupChanged();

                WildRydes.marker  = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

                // popup
                //     .setLatLng(e.latlng)
                //     .setContent("You clicked the map at " + e.latlng.toString())
                //     .openOn(map);
            }
        }
    });

    //  handlePickupChanged
    //      enable the Pickup button and set text to Request Unicorn
    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    //  handleRequestClick
    //      get current request location and POST request to server
    function handleRequestClick(event) {
        var pickupLocation =  WildRydes.map.selectedPoint;

        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    //  animateArrival
    //      animate the Unicorn's arrival to the user's pickup location
    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
        }

        if (dest.longitude > WildRydes.map.center.longitude) {
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }


}(jQuery));

//  these functions below here are my utility functions
//      to present messages to users
//      and to particularly add some 'sizzle' to the application

//  displayUpdate
//      nice utility method to show message to user
function displayUpdate(text, color='green') {
    $('#updates').prepend($(`<li style="background-color:${color}">${text}</li>`));
}

/*function windDirection(degrees, long) {
    let direction;
    if (long) {
        direction =["North", "North by North East", "North East", "East by North East", "East", "East by South East", "South East", "South by South East", "South", "South by South West", "South West", "West by South West", "West", "West by North West", "North West", "North by North West", "North" ];

    }
    else
        direction = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW", "N"];
    
    degrees = Math.round(degrees + 11.25) % 360;
    let index = Math.floor(degrees / 22.5);
    return direction[index];
}
/*function bookSearch(searchText) {
    fetch('https://www.googleapis.com/books/v1/volumes?q=${searchText}')
    .then(resp => resp.json())
    .then(books => showBooks(books));

}

function showBooks(books) {
    let b = books.items[0];
    console.log(b);
    if (b.saleInfo.listPrice === undefined) b.saleInfo.listPrice = {amount: 6.66}
    let msg = <ing src=${b.volumeInfo.imageLinks.smallThumbnail} height='120px' alt=""><br>You might enjoy <a href="${b.saleInfo.buyLink}">${b.volumeInfo.title}</a>written by ${b.volumeInfo.authors[0]}</br><br>${b.volumeInfo.pageCount} pages. Purchase for ${b.saleInfo.listPrice.amount}</br><br>${b.volumeInfo.description.substring(8,288)}';</br></ing>
    displayUpdate(msg, 'yellow');
    speak('You might enjoy ${b.volumeInfo.title} written by ${b.volumeInfo.authors[0]}')
}*/
//https://api.openweathermap.org/data/2.5/onecall?lat=${loc.latitude}&lon=${loc.longitude}&exclude=minutely,hourly&appid=a099a51a6362902523bbf6495a0818aa
/*function getWeather(loc) {
    let url = 'https://api.openweathermap.org/data/2.5/onecall?lat=32&lon=-97&exclude=minutely,hourly&appid=a099a51a6362902523bbf6495a0818aa';
    fetch(url)
        .then(response => response.json()) // wait for response and convert to JSON
        .then(weather => {
          
            // If the city was entered extract weather based on that API else use LatLon API result
            let wx = latLonToWeather(weather);
            let innerHTML = '';
            let msg;
            // We have converted the Lon Lat API (onecall) and City API (forecast) requests to the same form
            // lets build a nice card for each day of the weather data
            innerHTML += 'hellow';
            
            displayUpdate(innerHTML, unicorn.Color);
            
            msg = 'Temp is ${KtoF(weather.current.temp)} degrees, Wind at ${weather.current.wind_speed} miles per hour, out of the ${windDirection(weather.current.wind_deg, true)}';
            console.log(msg);
            speak ('Temp is ${KtoF(weather.current.temp)} degrees');
        
        });
}*/
    
