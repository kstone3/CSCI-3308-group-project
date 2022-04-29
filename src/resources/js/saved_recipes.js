/**
 * Unsaves a saved recipes.
 *
 * @author Jocelyn McHugo
 *
 * @param recipeData the data on the recipe stored in the cookie
 * @param recipeID the local ID of the recipe
 */
function unSaveRecipe(recipeData, recipeID) {
    var saveButton = document.getElementById(`save-recipe-${recipeID}`); // get the recipe's "Save Recipe" button
    if (saveButton.innerText === "Remove Recipe") { // confirm that the recipe is already saved
        document.cookie = document.cookie.replace(recipeData+',', ''); // remove recipe from cookie
        updateRecipes(); // update the recipe list
    }
}

/**
 * Render a list of the current saved recipes.
 *
 * @author Jocelyn McHugo
 */
function updateRecipes() {
    const cookies = document.cookie.split(';'); // get the cookie list
    var resultContainer = document.getElementById("resultContainer"); // get the container to render into
    resultContainer.innerHTML = ''; // clear recipes
    if (cookies[0] != "") { // there is at least one cookie
        const foundCookie = cookies.find(row => row.startsWith("savedRecipes=")) || cookies.find(row => row.startsWith(" savedRecipes=")); // find the savedRecipes cookie

        if (foundCookie) { // there is a savedRecipes cookie
            var savedRecipesStr = foundCookie.split('Recipes=')[1]; // get the content

            var savedRecipes = [];
            var counter = 0;

            // parse the cookie string into individual recipe JSON objects and push them to the saved recipes array
            savedRecipesStr.replace(/^\[{+/, '').replace(/}]+$/, '').replace(/'/g, '"').split('},{"name":').forEach(recipeStr => {
                if (recipeStr.startsWith('"name"')) {
                    savedRecipes.push(JSON.parse('{' + recipeStr + '}'));
                } else {
                    savedRecipes.push(JSON.parse('{"name":' + recipeStr + '}'));
                }

            });

            var currentRow;
            savedRecipes.forEach((recipe, index) => { // iterate through the list of recipes
                $.get({ // get recipe data from the API given the global recipe id
                    url: `https://api.edamam.com/api/recipes/v2/${recipe.id}?type=public&app_id=8532b295&app_key=0631fe51711b7eeed8ff29e3eedd0a3f&field=image`,
                    dataType: "json", async: false
                })
                    .then(data => {
                        if (index === 0 || (index+1) % 3 === 1 && index != 2 && index != 1) { // start of a new row
                            // make a new row div
                            resultContainer.innerHTML += `<div class="row" style="margin-bottom: 20px;" id="row-${index}-${index+2}"></div>`;
                            // set the current row to the new div
                            currentRow = document.getElementById(`row-${index}-${index+2}`);
                        }
                        // insert a new card into the current row
                        currentRow.innerHTML += `<div class="col-sm"><div class="card" style="overflow-wrap: break-word;" id="card-${index}"></div></div>`;
                        // get the current (new) card
                        var currentCard = document.getElementById(`card-${index}`)

                        // compose the card content and insert it into the current card
                        currentCard.innerHTML += `<img class="card-img" src="${data.recipe.image}">`;
                        currentCard.innerHTML += `<h5 class="card-title">${recipe.name}</h5>`;
                        var recipeContent = `&quot;{'name':'${recipe.name}','ingredients':'${recipe.ingredients}','url':'${recipe.url}','id':'${recipe.id}'}&quot;`;
                        currentCard.innerHTML += `<div id="button-div-${index}" style="text-align: center; margin-bottom:5px;" ></div>`;
                        var currentDiv = document.getElementById(`button-div-${index}`);
                        currentDiv.innerHTML += `<button id="save-recipe-${index}" onclick="unSaveRecipe(${recipeContent}, ${index})" class="default-button" style="margin-right: 10px;">Remove Recipe</button>`
                        currentDiv.innerHTML += `<a href="${recipe.url}" class="default-button" >Recipe Page</a>`;
                    });
            });

        } else { // there is no saved recipes cookie
            resultContainer.innerHTML = `<p>You have no saved recipes!</p>`; // render
        }
    } else { // there are no cookies
        resultContainer.innerHTML = `<p>You have no saved recipes!</p>`; // render
    }
}

window.addEventListener("load", event => { // render recipes onload
    updateRecipes();
});