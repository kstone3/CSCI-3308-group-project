var globalPage = 1;
var nextPage = '';

/**
 * Saves a recipe to the savedRecipes cookie. Triggered by the "Save Recipe" button on each recipe card
 *
 * @author Jocelyn McHugo
 *
 * @param recipeData the data JSON for the recipe, of format {name:[string], ingredients:[array of JSON strings], url:[string], id:[string]}
 * @param recipeID the local ID of the recipe (its index in the API search response, generated in getRecipes())
 */
function saveRecipe(recipeData, recipeID) {
    var saveButton = document.getElementById(`save-recipe-${recipeID}`); // get the save button associated with this recipe
    if (saveButton.innerText === "Saved!") { // the recipe has already been saved
        document.cookie = document.cookie.replace(recipeData+',', ''); // remove this recipe from the cookie
        saveButton.innerText = "Save Recipe"; // update button text
    } else { // this is a new recipe
        const cookies = document.cookie.split(';'); // split into list of cookies
        var savedRecipes = '';
        var otherCookiesStr = ''
        if (cookies[0] != "") { // there is at least one cookie
            const foundCookie = cookies.find(row => row.startsWith("savedRecipes=")) || cookies.find(row => row.startsWith(" savedRecipes=")); // find the savedRecipes cookie
            if (foundCookie) { // there is alread a savedRecipes cookie
                savedRecipes = foundCookie.split('Recipes=')[1]; // get the content of the cookie
            }
            const otherCookies = cookies.filter((element) => {
                element.startsWith(`savedRecipes=`); // remove the savedRecipes cookie from this list of cookies
            });
            otherCookies.forEach(cookie => {
                otherCookiesStr += cookie + ";"; // recompose the cookie string, without savedRecipes
            });
        }
        if (savedRecipes) { // there were already saved recipes
            document.cookie = otherCookiesStr + `savedRecipes=${savedRecipes.replace(/;+$/, '').replace(/]+$/, '')},${recipeData.toString()}];`; // recompose the cookie string, including savedRecipes, with the new recipe
        } else {
            document.cookie = otherCookiesStr + `savedRecipes=[${recipeData.toString()}];`; // recompose the cookie string with the new savedRecipes cookie
        }
        saveButton.innerText = "Saved!"; // update button text
    }
}

/**
 * Gets the specified or next page of recipes from the API, based on the search query and filters.
 * Triggered by "Update Filters" button, "Search" button, "Load Next" button.
 *
 * @author Jocelyn McHugo
 *
 * @param page (optional) the page number to render
 */
function getRecipes(page) {
    if (!page) { // function was called pageless (load next button)
        page = globalPage + 1; // increment page
    }
    globalPage = page; // update globalPage variable
    var plainQuery = document.getElementById("search-bar").value; // get the query
    var query = plainQuery.replace(/\s/g, '+'); // make the query urlsafe
    var resultContainer = document.getElementById("resultContainer"); // get the container where the results will be loaded
    var cuisine = document.getElementById("cuisine-type").value;
    var meal = document.getElementById("meal-type").value;
    var dish = document.getElementById("dish-type").value;
    var url = '';
    if (globalPage === 1) { //begin a new search
        //compose the url
        url = `https://api.edamam.com/api/recipes/v2?type=public`;
        if (query) {
            url += '&q=' + query;
        }else{ // a query must be defined
            resultContainer.innerHTML += '<h5 style="color: red;">Please provide a search query</h5>';
            return;
        }
        url += `&app_id=8532b295&app_key=0631fe51711b7eeed8ff29e3eedd0a3f`; // api keys
        if (cuisine){
            url += `&cuisineType=${cuisine}`;
        }
        if (meal){
            url += `&mealType=${meal}`;
        }
        if (dish){
            url += `&dishType=${dish}`;
        }
        url += '&field=uri&field=label&field=image&field=url&field=yield&field=ingredients&field=totalTime&field=cuisineType&field=mealType&field=dishType'; // parameters
        resultContainer.innerHTML = ''; // clear existing recipes
        document.getElementById("next-page").style.visibility = "visible"; // show next page button
    } else { //load next page
        document.getElementById("next-page").style.visibility = "visible"; // show next page button
        url = nextPage; //load the next page
    }

    $.ajax({url: url, dataType: "json"}) // ajax request to created url with json type response
        .then(data => {
            if (data.hasOwnProperty("errorCode")) { // check if there is an error
                console.log(data.errorCode); // log to console
                resultContainer.innerHTML += '<h5 style="color: red;">ERROR: ' + data.message + '</h5>'; // display error to users
            } else {
                var composedHTML = '';
                var counter = 0;
                data.hits.forEach((hit, index) => { // iterate through recipe list
                    var recipe = hit.recipe; // current recipe
                    if (counter === 0) { // this is the first of a set of three
                        composedHTML += '<div class="row" style="margin-bottom: 20px;">'; // create a new row
                    }
                    // compose the recipe card
                    composedHTML += '<div class="col-sm"><div class="card" style="overflow-wrap: break-word;">';
                    composedHTML += `<img class="card-img" src="${recipe.image}">`;
                    composedHTML += `<h5 class="card-title">${recipe.label}</h5>`;
                    if (recipe.time) {
                        composedHTML += `<p class="card-text"><strong>Time: </strong>${recipe.time} minutes </p>`;
                    }
                    if (recipe.yield) {
                        composedHTML += `<p class="card-text"><strong>Yield: </strong>${recipe.yield}</p>`;
                    }
                    // compose the information for the cookie
                    var ingredients = "[";
                    recipe.ingredients.forEach(ing => {
                        ingredients += `{~item~:~${ing.food.replace(/'/g, '')}~,~amt~:~${ing.quantity}~,~unit~:~${ing.measure}~},`;
                    });
                    ingredients = ingredients.replace(/,+$/, '') + ']';
                    var recipeContent = `&quot;{'name':'${recipe.label.replace(/'/g, '')}','ingredients':'${ingredients}','url':'${recipe.url}','id':'${recipe.uri.split('#recipe_')[1]}'}&quot;`;

                    composedHTML += `<div id="button-div" style="text-align: center; margin-bottom:5px;">`;
                    // compose the saverecipe button, with the recipe's local ID
                    composedHTML += `<button id="save-recipe-${index + data.from - 1}" onclick="saveRecipe(${recipeContent}, ${index + data.from - 1})" class="default-button" style="margin-right: 10px;">Save Recipe</button>`;
                    composedHTML += `<a href="${recipe.url}" class="default-button" >Recipe Page</a>`;
                    composedHTML += `</div></div></div>`;
                    counter++; // increment the recipe counter
                    if (counter === 3) { // this is the last recipe in its set of three
                        composedHTML += '</div>'; // end the row
                        counter = 0; // reset the counter
                    }
                })
                nextPage = data._links.next.href; // set the global nextPage variable to the link to the next page received from the API
                resultContainer.innerHTML += composedHTML; // update the results container with the composed HTML
                if (globalPage >= Math.ceil(parseInt(data.count) / 20)) { // this is the last page of content
                    document.getElementById("next-page").style.visibility = "hidden"; // hide the "load next page" button
                }
            }
        });
}


