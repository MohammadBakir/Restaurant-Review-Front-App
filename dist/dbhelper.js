/**
 * Common database helper functions.
 */


class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    //const port = 1337; // Server port
    //return `http://localhost:${port}/restaurants`;
    return `https://restaurantreviewsserver.herokuapp.com/restaurants`
  }

  static get databaseReviewsURL() {
    //const port = 1337; // Change this to your server port
    //return `http://localhost:${port}/reviews`;
    return `https://restaurantreviewsserver.herokuapp.com/reviews`
  }

  /**
   * Fetch all restaurants.
   */
   static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}`)
    .then(function(response) {
      return response.json();
    }).then(data => callback(null,data))
    .catch(error => {
      console.log(`Network requests have failed, Returned status of ${error.statusText}`, null);
      getLocalEventData()
      .then(offlinedata => callback(null,offlinedata));
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'All Cuisines') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'All Neighborhoods') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }


  /**
   * Restaurant image URL.
   */
   static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph){
      return (`${restaurant.photograph}.jpg`);
   } 
 }
   
  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 


  static fetchRestaurantReviewsById(restaurantID, callback) {
    // Fetch reviews for the specific restaurant
    if (navigator.onLine) {
      const fetchDatabaseURL = DBHelper.databaseReviewsURL + "/?restaurant_id=" + restaurantID;
      const fetchProtocol = {method: "GET"};
      fetch(fetchDatabaseURL, fetchProtocol).then(response => 
      {
      /*A request is a stream and can only be consumed once. 
      Since we are consuming this once by cache and once by the browser for fetch, 
      we need to clone the response.*/ 
      const requestCloneOk = !response.clone().ok;
      const requestCloneRedirect = !response.clone().redirected;
        if (requestCloneOk && requestCloneRedirect) {
          throw "Reviews not available for this restaurant";
        }
        response.json().then(data => {
            callback(null, data);
          })
      }).catch(error => 
            console.log(`Failed to return Reviews from the database`, callback(error, null))
        );
    } else {
    /*
    for offline cases, go into the database and fetch all reviews that are associated with the restaurant
    page accessed and display them on the page. 
  */
    const dbPromise = idb.open('Restaurants', 1);
    dbPromise.then(db => {
    var tx = db.transaction(['online-restaurant-reviews'], "readwrite");
    var objectStore = tx.objectStore('online-restaurant-reviews');
    var objectStoreTitleRequest = objectStore.getAll()
    .then(event => {
      var data = [];
      for (var i = 0; i < event.length; i++) {
        if (event[i].restaurant_id == restaurantID) {
          data.push(event[i]);
        }
      };
      callback (null, data);
    });
  });
  };
}

  /**
  The updateDatabaseFavStatus function performs the following after the user Favors/Unfavors a restaurant
    1. The restaurant data property, 'is_favorite' is updated in the database via the 
       fetch protocol and PUT method. The PUT Endpoint has been provided with the database API. 
    2. The 'is_favorite' property is then updated in the indexeddb database with the new favorite status via 
       'DBHelper.updateIDBRestaurantData'.
  **/
  static updateDatabaseFavStatus(id, newState) {
    const favPUTEndpoint = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${newState}`;
    const fetchProtocol = {method: "PUT"};
    if (navigator.onLine) {
      fetch(favPUTEndpoint, fetchProtocol); 
      DBHelper.updateIDBRestaurantData(id,newState);
    } else {
      console.log("Can't Add Favorites Status to Database,currenlty Offline, Adding to offline-restaurant-object store");
      const body = {
        id: id,
        is_favorite: newState
      }
      DBHelper.IDBOfflineRestaurantReviewsFavs(body);
    }
  }

  static updateIDBRestaurantData(restaurantId, newState) {
  const dbPromise = idb.open('Restaurants', 1);
  dbPromise.then(db => {
    var tx = db.transaction('restaurant-info', "readwrite");
    var objectStore = tx.objectStore('restaurant-info');
    var objectStoreTitleRequest = objectStore.get(restaurantId)
    .then(event => {
      var data = event;
      data.id = restaurantId;
      data.is_favorite = newState;
      objectStore.put(data);
      return tx.complete;
      });
    });
  }

  static IDBOfflineRestaurantReviewsFavs(body) {
  const dbPromise = idb.open('Restaurants', 1);
  dbPromise.then(db => {
    var tx = db.transaction('offline-restaurant-favs-status', "readwrite");
    var objectStore = tx.objectStore('offline-restaurant-favs-status');
    objectStore.add(body);
    console.log("Successfully added favorite status to the offline IDB.");
    return tx.complete;
    }).catch(error => {
         console.log("Could Not Add Review to online-restaurant-info Object Store", error);
    });
  }

  static updateDatabaseForFavStatusWhenOnline(){
    //Open indexeddb Database 'Restaurants'
    const dbPromise = idb.open('Restaurants', 1);
    dbPromise.then(db => {
      var tx = db.transaction('offline-restaurant-favs-status', "readwrite");
      var objectStore = tx.objectStore('offline-restaurant-favs-status');
      //Read stored offline review.
      var response = objectStore.getAll();
      //Clear objects store to prevent doubling of review additions under multiple offline cases!
      objectStore.clear();
      return response;
    }).then(response => {
      for (var i = 0; i < response.length; i++) {
            DBHelper.updateDatabaseFavStatus(response[i].id,response[i].is_favorite);
          }
      console.log("Successfully updated Restaurants favorite status");
    });
  }

  /**
  The saveReviewTODB function performs the following once user selects to save their review on the 
  restaurant_reviews page.
    1. Restaurant ID, User Name, User Rating, and User Comments are stored into a review body as per the
       following parameters. 
          Parameter
          {
            "restaurant_id": <restaurant_id>,
            "name": <reviewer_name>,
            "rating": <rating>,
            "comments": <comment_text>
          }
    2. If the user is online, the review body is passed to 'DBHelper.postReview' for database addition
       and indexeddb object store addition. 
    3. If the user is offline, the review body is passed to 'DBHelperIDBOfflineRestaurantReviewsStore' for
       offline storage. 
  **/
  static saveReviewToDB(id, name, rating, comments, callback) {
    // Block any more clicks on the submit button until the callback
   const btn = document.getElementById("reviewSubmit");
   btn.onclick = null;

  // Create the POST body
    const body = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comments,
      createdAt: Date.now()
    }

  //If online store review online via 'DBHelper.postReview', else
  //If offline store review offline via 'DBHelper.IDBOfflineRestaurantReviewsStore'
  if (navigator.onLine) { 
        console.log("Posting Review")
        DBHelper.postReview(`${DBHelper.databaseReviewsURL}`, body , (error,result) => {
          if (error) {
            callback(error, null);
            return;
          }
          callback(null, result);
        }) 
      } else {
        DBHelper.IDBOfflineRestaurantReviewsStore(body);
        console.log("Currently Offline! Review will be save to Indexeddb until online.");
      }
}
  
  /**
  The postReview function performs the following:
    1. The review body is turned into a JSON text and stored as a string
    2. The review is posted to the database via fetch and the POST method. 
    3. The response is then passed to DBHelper.updateIDBStoredRestaurantReviews to update the 
       online reviews objectstore.
  **/  
 static postReview(url = ``, data = {}, callback) {
   var postMethod = "POST";
   var postBody = JSON.stringify(data);
   return fetch(url, {
        method: postMethod, 
        body: postBody,
    }).then(function(response) {
        if(response.ok) {
          console.log("Review Successfully Added to Database");
          return response.json();
        }
        throw new Error('Network response was not ok.');
  }).then(data => {
     DBHelper.updateIDBStoredRestaurantReviews(data);
     //Go to the restaurant page once review is posted. 
     setTimeout(function(){ 
      window.location.href = "/restaurant.html?id=" + self.restaurant.id;}
      ,1000);
  }).catch(function(error) {
    console.log('There has been a problem with your fetch operation: ', error.message);
  });
}

  /**
  The updateIDBStoredRestaurantReviews function performs the following:
    1. The review body is turned into a JSON text and stored as a string
    2. The review is posted to the database via fetch and the POST method. 
    3. The response is then passed to DBHelper.updateIDBStoredRestaurantReviews to update the 
       online reviews objectstore.
  **/ 
  static updateIDBStoredRestaurantReviews(postBody) {
  const dbPromise = idb.open('Restaurants', 1);
  dbPromise.then(db => {
    var tx = db.transaction('online-restaurant-reviews', "readwrite");
    var objectStore = tx.objectStore('online-restaurant-reviews');
    postBody = JSON.parse(JSON.stringify(postBody));
    objectStore.add(postBody);
    console.log("Successfully added review to the IDB Database.");
    return tx.complete;
    }).catch(error => {
         console.log("Could Not Add Review to online-restaurant-reviews Object Store", error);
    });
  }

  /**
  The IDBOfflineRestaurantReviewsStore function performs the following after it is determined the user
  has gone offline in DBHelper.saveReviewToDB:
    1. Object store 'offline-restaurant-reviews' is opened.
    2. The offline stored review is stored using the add method.
    *Once the user is back online DBHelper.updateDatabaseWhenOnline will post offline review to database*
  **/
  static IDBOfflineRestaurantReviewsStore(offlinePostBody) {
  const dbPromise = idb.open('Restaurants', 1);
  dbPromise.then(db => {
    var tx = db.transaction('offline-restaurant-reviews', "readwrite");
    var objectStore = tx.objectStore('offline-restaurant-reviews');
    objectStore.add(offlinePostBody);
    console.log("Successfully added review to the offline database.");
    //Go to the restaurant page once review is posted. 
     setTimeout(function(){ 
      window.location.href = "/restaurant.html?id=" + self.restaurant.id;}
      ,1000);
    return tx.complete;
    }).catch(error => {
         console.log("Could Not Add Review to offline-restaurant-reviews Object Store", error);
    });
  }

  /**
  The updateDatabaseWhenOnline function performs the following once user connection is back online as determined 
  by the window.addEventListener call in 'OfflineToOnline.js'
    1. Object store 'offline-restaurant-reviews' is opened.
    2. The offline stored review is read using the get method and is passed to 'DBHelper.postReview'
       for datbase and online-reviews cache storage. f
    3. The offline review object store is then cleared. 
  **/
  static updateDatabaseWhenOnline(){
    //Open indexeddb Database 'Restaurants'
    const dbPromise = idb.open('Restaurants', 1);
    dbPromise.then(db => {
      var tx = db.transaction('offline-restaurant-reviews', "readwrite");
      var objectStore = tx.objectStore('offline-restaurant-reviews');
      //Read stored offline review.
      var response = objectStore.getAll();
      //Clear offline-reviews-objects store to prevent doubling of review additions under multiple offline cases!
      objectStore.clear();
      return response;
    }).then(response => {
      /**
        Delete id property as this will automatically be generated by the reviews database
        and pass offline review to DBHelper.postReview
      **/
      for (var i = 0; i < response.length; i++) {
            delete response[i].id;
            DBHelper.postReview(`${DBHelper.databaseReviewsURL}`, response[i])
          }
    });
  }

  static populateReviewInfoDatabase(restaurantID,restaurant) {
   fetch(`${DBHelper.databaseReviewsURL+"/?restaurant_id="+restaurantID}`)
   .then(response => response.json())
   .then(data => {
        idb.open('Restaurants', 1).then(function(db){
        var tx = db.transaction('online-restaurant-reviews', 'readwrite');
        var reviewsStore = tx.objectStore('online-restaurant-reviews');
        for (var i = 0; i < data.length; i++) {
              reviewsStore.put(data[i]);
            }
            console.log("Successfully added restaurant reviews to IDB database.")
        }).catch(error => {
          console.log("Failed to add restaurant reviews to database: ", error);
        })
    })
   .catch(error => {
    console.log("Failed to fetch, error message: ", error);
   })
}


}

function getLocalEventData(response) {
      console.log('Calling get Local Event Data')
      return idb.open('Restaurants', 1).then(db => {
      const tx = db.transaction('restaurant-info', 'readonly');
      const restaurantStore = tx.objectStore('restaurant-info');
      return restaurantStore.getAll();
    });
}

   /**
    Saving this chunk of code for potential future use.
    **
    var objectStoreLengthCount = objectStore.getAll()
    .then(event => {
      console.log(event.length);
      return event.length;
    }).then( length => {
        postBody = JSON.parse(postBody);
        var item = {
          id: length+1,
          postBody
        };
        objectStore.add(postBody);
        console.log("Successfully added review to the cache.");
        return tx.complete;
      }).catch(error => {
         console.log("Could Not Add Review to restaurant-reviews Object Store", error);
      });
    });
    **/
