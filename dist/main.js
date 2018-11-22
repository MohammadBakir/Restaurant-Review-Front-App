let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.label = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.label = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibW9oYW1tYWRiYWtpcjkwIiwiYSI6ImNqaWI4N21pazFmZDkzd3FxeGtnZjhhcWwifQ.tPM6n3scGwow_6X0uHxenA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  }
  /*
  restaurants.forEach(restaurant => {
    if (restaurant["is_favorite"]) {
      ul.append(createRestaurantHTML(restaurant,restaurant["is_favorite"].toString()));
    } else {
      console.log('Restaurant Does Have Fav Status');
    }
  });
  addMarkersToMap();
}*/

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, fav_status) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  if (restaurant.photograph) {
    const imgurlbase = DBHelper.imageUrlForRestaurant(restaurant, 'titles');
    const imgparts = imgurlbase.split('.');
    const imgurl1x = imgparts[0] + '_1x.' + imgparts[1];
    const imgurl2x = imgparts[0] + '_2x.' + imgparts[1];
    image.src = imgurl1x;
    image.srcset = imgurl1x +' '+ '300w' + ',' +' ' + imgurl2x +' '+ '600w' ;
  }
  else {
    image.src = '/not-found.png';
  }
  image.alt = restaurant.name;
  
  li.append(image);
  
  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  var more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.className = "detailsButton"
  more.onclick = function() {
    const url = DBHelper.urlForRestaurant(restaurant);
    return window.location = url;
  }
  li.append(more)

  var isFavorite = (fav_status === "true") ? true : false;
  var favoriteButton = document.createElement("button"); 
  favoriteButton.style.background = isFavorite
  //icons were borrowed from Project Coach Doug Brown.
    ? `url("/002-like.svg") no-repeat`
    : `url("001-like.svg") no-repeat`;
  favoriteButton.innerHTML = isFavorite
    ? " Favorite"
    : " Non Favorite";
  favoriteButton.id = "fav-icon-button" + restaurant.id;
  favoriteButton.onclick = event => favClickHandle(restaurant.id, !isFavorite);

  li.append(favoriteButton);
  return li
}
  
function favClickHandle(id, newState) {
  /// Update properties of the restaurant data object
  const favorite = document.getElementById("fav-icon-button" + id);
  const restaurant = self.restaurants.filter(rest => rest.id ===id)[0];
  if (newState){
      favorite.style.background = `url("/002-like.svg") no-repeat`;
      favorite.innerHTML = "Favorite";

  } else if (!newState) {
    favorite.style.background = `url("/001-like.svg") no-repeat`;
    favorite.innerHTML = "Non Favorite";
  }
  if (!restaurant)
    return;
  restaurant["is_favorite"] = newState;
  favorite.onclick = event => favClickHandle(restaurant.id, !newState);
  DBHelper.updateDatabaseFavStatus(id, newState)
}; 
 
/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
} 
