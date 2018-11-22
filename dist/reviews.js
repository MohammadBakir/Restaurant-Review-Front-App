let restaurant;
/**
 * Initialize Page Load as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initPage();
});

initPage = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      fillBreadcrumb();
    }
  });
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const image = document.getElementById('restaurant-img');
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

  // fill reviews
  UserReviewsHTML();
}


lb = function () { 
  return document.createElement( 'BR' ); 
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
UserReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container-user');
  const title = document.createElement('h2');
  title.setAttribute("id", "review-form-header");
  title.innerHTML = 'Review Form';
  container.appendChild(title);

  const containerForm = document.getElementById('reviews-container-user');
  var form = document.createElement("div");
  form.setAttribute('id', "reviewForm");
  containerForm.appendChild(form);

  var nameLabel = document.createElement("label"); //input element, text
  nameLabel.setAttribute('for',"reviewer-name-container");
  nameLabel.innerHTML = "Name";

  var nameInput = document.createElement("input"); //input element, text
  nameInput.setAttribute('type',"text");
  nameInput.setAttribute('id', "reviewer-name-container");
  nameInput.setAttribute('name',"reviewer-name");
  nameInput.setAttribute('aria-labelledby', "namelabel");
  nameInput.setAttribute('placeholder', `Your First and Last Name`);

  lb();

  var selectLabel = document.createElement("label"); //input element, text
  selectLabel.setAttribute('for',"ratingSelect");
  selectLabel.innerHTML = "Rating Selection";

  var array = ["1","2","3","4","5"];
  var selectList = document.createElement("select");
  selectList.setAttribute("id", "ratingSelect");
  
  for (var i = 0; i < array.length; i++) {
    var option = document.createElement("option");
    option.setAttribute("value", array[i]);
    option.text = array[i];
    selectList.appendChild(option);
  }

  lb();
  
  var reviewLabel = document.createElement("label"); //input element, text
  reviewLabel.setAttribute('for',"review-input");
  reviewLabel.innerHTML = "Review";
  
  var reviewTextArea = document.createElement("textarea"); //input element, text
  reviewTextArea.setAttribute('type',"text");
  reviewTextArea.setAttribute('id', "review-input");
  reviewTextArea.setAttribute('name',"reviewer-input");
  reviewTextArea.setAttribute('aria-labelledby', "review text area");
  reviewTextArea.setAttribute('maxlength', '5000');
  reviewTextArea.setAttribute('placeholder', `Your review helps others learn about great local businesses.`)

  var submitReviewButton = document.createElement("button"); 
  submitReviewButton.setAttribute('id', 'reviewSubmit');
  submitReviewButton.innerHTML ="Post Review";
  submitReviewButton.onclick = event => saveReview();

  form.appendChild(nameLabel);
  form.appendChild(nameInput);
  form.appendChild(selectLabel);
  form.appendChild(selectList);
  form.appendChild(reviewLabel);
  form.appendChild(reviewTextArea);
  form.appendChild(submitReviewButton);
}
 
const saveReview = () => {
  const name = document.getElementById("reviewer-name-container").value;
  const rating = document.getElementById("ratingSelect").value;
  const comments = document.getElementById("review-input").value;
  
    DBHelper.saveReviewToDB(self.restaurant.id, name, rating, comments, (error, review) => {
    if (error) {
      console.log("Error saving restaurant review")
    }
    });
} 
    
  
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}





