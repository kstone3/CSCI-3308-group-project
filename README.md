# SharpPantry

## Project Description

Upon logging in, the user will be able to enter the ingredients they already have in their pantry into our website, which will store them in the database. The user will then have
the option to select keywords and other filters, which will be applied to a search of our recipe
API. The user will then be presented with a list of recipes which meet their search criteria
to select from. Once one or more recipes are selected, the website will generate a shopping list for the user, which
includes all of the ingredients required for the recipe(s) that are not already in their pantry.

The value of this application is that it enables the user to optimize their recipes for the ingredients they already
have, minimizing food waste and grocery spending. By selecting recipes on our website _before_ they go to the grocery
store and having a ready-made grocery list, the user will be more likely to buy only the ingredients they need, saving
money without compromising on food quality. Our website also helps the user not waste the ingredients they already have
by providing a system to track the contents of their pantry and generating recipes that use those ingredients.

[//]: # (## Project Architecture Overview)

[//]: # (![img.png]&#40;img.png&#41;)

## Project Structure

```
  ├─src/
  │   ├─heroku/
  │   │  └─Dockerfile
  │   ├─resources/
  │   │   ├─css/
  │   │   │  ├─homepage_style.css
  │   │   │  ├─login.css 
  │   │   │  └─main_style.css
  │   │   ├─database/
  │   │   │    ├─create.sql
  │   │   │    └─Dockerfile
  │   │   ├─img/
  │   │   │  ├─chefs-hat.png
  │   │   │  ├─default_profile.png
  │   │   │  ├─loginPantry.jpeg
  │   │   │  └─smallPantry.jpg
  │   │   └─js/
  │   │      ├─homepage.js
  │   │      ├─login.js
  │   │      ├─recipe_search.js
  │   │      └─saved_recipes.js
  │   ├─views/
  │   │  ├─pages/
  │   │  │   ├─grocery_list.ejs
  │   │  │   ├─homepage.ejs
  │   │  │   ├─login.ejs
  │   │  │   ├─pantry.ejs
  │   │  │   ├─recipe_search.ejs
  │   │  │   └─saved_recipes.ejs
  │   │  └─partials/
  │   │      ├─footer.ejs
  │   │      ├─header.ejs
  │   │      └─navbar.ejs
  │   ├─Dockerfile
  │   ├─docker-compose.yml
  │   ├─package-lock.json
  │   ├─package.json
  │   └─server.js
  ├─.gitignore
  ├─img.png
  └─README.md  
```
## Testing
User Acceptance Tests
 1) Pantry Page
    -The table on the page loads the correct information for the logged in user

    -The add button adds the given ingredient to the table, adding to the quantity if that ingredient already exists

    -The delete button removes the correct quantity from the given ingredient in the table when given a valid ingredient.

    -The delete button results in an error when given an ingredient that does not exist in the table. 

 2) Recipe Search / Api Connection
    -Recipes from the API load

    -Recipes continue to load as the user scrolls

    -Recipes are related to the given search term

    -Filters are applied when selected

    -The filters grab ingredients from the user’s pantry

    -Recipe card links to expanded recipe page

    -User can save a recipe
    
 3) Grocery List
    -Includes ingredients from selected recipes

    -Does not include ingredients already in the user’s pantry

    -The Grocery List does not include any recipes from a previous session / login.


## How to build and run locally
Create a .env file  in the src folder with this code in it
```
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="sharp_pantry_db"
 ```

Also create a .env file in the src/heroku folder of this format:
```
HEROKU_API_KEY=[your key]
```
Replacing `[your key]` with your Heroku API key (which can be found by running `heroku auth:token` while logged in to Heroku CLI)

Then ***make sure you are in the src folder*** and run `docker-compose up`

Alternatively you can just go to the heroku website at https://sharp-pantry.herokuapp.com/