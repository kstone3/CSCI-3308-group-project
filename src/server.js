var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const crypto = require("crypto");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// setup database and heroku
var pgp = require('pg-promise')();

require('dotenv').config();

const dev_dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD //FIXME IMPORTANT change the names in your .env file to match these
};

const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

if (isProduction) {
    pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

let db = pgp(dbConfig);


// Setup for reading user cookies
var cookieParser = require('cookie-parser');
const e = require('express');
app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));

/**
 * Default get request. Renders the homepage.
 */
app.get('/', function (req, res) {
    res.render('pages/homepage')
});

/**
 * Home get request. Renders the homepage
 */
app.get('/home', function (req, res) {
    res.render('pages/homepage')
});

/**
 * Login get request. Renders the login page
 */
app.get('/login', function (req, res) {
    res.render('pages/login', {msg: '', err: false});
})

/**
 * Logout get request. Clears the user's session and renders the login page.
 */
app.get('/logout', function (req, res) {
    res.clearCookie('userID');
    res.render('pages/login', {
        msg: '',
        err: false
    });
})

/**
 * Login response post request. Triggered by login attempt by the user.
 * Checks email and hashed password against user table in the database.
 * If the user exists and the password matches, set the user cookie and render the homepage.
 * If the user does not exist and/or the password does not match, render the login page with an error.
 *
 * @author Jocelyn McHugo
 */
app.post('/login_response', function (req, res) {
    var email = req.body.email_login; // get the email from the form
    const hasher = crypto.createHash("sha256"); // initialize the hasher
    var password = hasher.update(req.body.password_login.toString()).digest("hex").toString(); // hash the password from the form
    var query = `select id, name, password
                 from users
                 where email = '${email}';`; // query to get users with the provided email

    db.oneOrNone(query) // query the database for exactly 1 or exactly 0 responses
        .then(user => {
            if (user) { // the email is in the database
                if (password === user.password.toString()) { // the password matches
                    res.cookie("userID", user.id); // set cookies
                    res.render('pages/homepage');
                } else { // the password does not match
                    res.render('pages/login', {msg: 'Invalid Password', err: true}); // render error
                }
            } else { // the email is not in the database
                res.render('pages/login', {msg: 'Invalid Email', err: true}) // render error
            }
        })
        .catch(error => { // a different error has occurred
            res.render('pages/login', {msg: error, err: true});
        })
});

/**
 * Register response post request. Triggered by registration attempt by the user.
 * Checks email against user table in the database.
 * If the email exists in the database, render the login page with an error.
 * If the email does not exist, insert a new user into the database and render the login page with a success message.
 *
 * @author Jocelyn McHugo
 */
app.post('/register_response', function (req, res) {
    var name = req.body.firstName + " " + req.body.lastName; // get full name from form
    var email = req.body.email; // get email from form
    const hasher = crypto.createHash("sha256"); // initialize hasher
    var password = hasher.update(req.body.password.toString()).digest("hex").toString(); // hash password from form

    var query = `select email
                 from users
                 where email = '${email}';`; // query to search the database for the given email

    db.oneOrNone(query) // query the database expecting either extactly 1 or exactly 0 responses
        .then(user => {
            if (user) { // the user already exists
                res.render('pages/login', {msg: 'Email already in use', err: true}); // render error
            } else { // the user does not exist
                var insertQuery = `insert into users (name, email, password)
                                   values ('${name}', '${email}', '${password}');`; // query to insert a new user with the given info
                db.any(insertQuery) // insert
                    .then(response => { // success
                        res.render('pages/login', {msg: 'User registered!', err: false}); // render success
                    })
                    .catch(error => { // an error has occurred with the insert
                        res.render('pages/login', {msg: error, err: true}) // render error
                    })
            }
        })
        .catch(error => { // an error has occurred with the search
            res.render('pages/login', {msg: error, err: true}) // render error
        })
});

/**
 * Pantry get request. Renders pantry page with user's up-to-date pantry.
 *
 * @author Adam Richling
 */
app.get('/pantry', function (req, res) {
    var userID = req.cookies.userID;
    var textJSON = "[";
    var getPantry = `SELECT *
                     FROM pantry
                     WHERE userID = ${userID};`;
    var getPantrySize = `SELECT COUNT(*)
                         FROM pantry
                         WHERE userID = '${userID}';`;
    //Generate a JSON for the pantry page to read
    db.task("JSON-info", task => {
        return task.batch([
            task.any(getPantrySize),
            task.any(getPantry)
        ]);
    })
        .then(info => {
            //console.log("JSON-info: ", info);
            var pantrySize = Number(info[0][0].count);
            //console.log("Pantry Size: ", pantrySize);

            var gather = new Promise((resolve, reject) => { //Needed to make sure that the code resolves in the correct order
                //console.log("Inside of gather");
                var index = 0;
                if (pantrySize > 0) {
                    info[1].forEach((ele) => {
                        //console.log("Inside JSON for loop");
                        //console.log("Index: ", index);
                        getIngrName = `SELECT name
                                       FROM ingredients
                                       WHERE ingredientID = '${ele.ingredientid}';`;
                        //console.log("info[1][i].ingredientID: ", ele.ingredientid);
                        db.any(getIngrName)
                            .then(ingrName => {
                                //console.log("Inside of JSON inner db search");
                                if (index > 0) { //Adding a comma between JSON items
                                    //console.log("Adding a comma");
                                    textJSON = textJSON + ",";
                                    //console.log("textJSON: ", textJSON);
                                }
                                //console.log("ingrName: ",ingrName);
                                textJSON = textJSON + `{"name":"${ingrName[0].name}","quantity":"${ele.quantity}"}`;
                                //console.log("textJSON: ",textJSON);
                                //console.log("info[0].length: ", info.length);
                                if (index === pantrySize - 1) {
                                    resolve(textJSON);
                                } else {
                                    index += 1;
                                }
                            })
                            .catch(error => {
                                console.log("Inside JSON inner catch");
                                console.log(error);
                            })
                    });
                } else { //Handles edge case of pantry being empty
                    resolve('Pantry is empty');
                }
            })
            gather.then(() => {
                textJSON = textJSON + "]";
                var pantryJSON = JSON.parse(textJSON);
                //console.log("pantryJSON: ", pantryJSON);
                res.render('pages/pantry', {
                    pantry: pantryJSON
                });
            })

        })
        .catch(error => {
            console.log(error);
            res.render('pages/pantry', {
                pantry: ''
            });
        })
        .catch(function (err) {
            // display error message in case an error
            console.log('error', err);
            res.render('pages/pantry', {
                data: ''
            })
        })
});

/**
 * Profile get request. Sends information on current user in JSON form.
 * Triggered onload for all pages to render profile popover.
 *
 * @author Jocelyn McHugo
 */
app.get('/profile', function (req, res) {
    var userID = req.cookies.userID; // get the current user's ID
    var query = `SELECT name, email
                 FROM users
                 WHERE id = '${userID}';` // query to get the current user

    db.oneOrNone(query) // query the database, expecting exactly 1 or exactly 0 responses
        .then(data => {
            if (data) { // user exists
                res.json({"usrName": data.name, "usrEmail": data.email}); // send user info
            } else {
                res.json({"error": "User not found"}); // send error
            }
        })
        .catch(error => { // an error has occurred
            res.json({"error": error}) // send error
        })
});

/**
 * Recipe search get request. Renders recipe search page
 *
 */
app.get('/recipe_search', function (req, res) {
    res.render('pages/recipe_search')
});

/**
 * Saved recipes get request. Renders saved recipes page
 *
 */
app.get('/saved_recipes', function (req, res) {
    res.render('pages/saved_recipes')
});

/**
 * Pantry update items post request. Updates pantry items in the database.
 *
 * @author Adam Richling
 */
app.post('/pantry/update_items', function (req, res) {
    //Grab User Info
    var userID = req.cookies.userID;
    //Pull information from the correct fields
    var ingredientName = req.body.ingredientName;
    var ingredientQuantity = req.body.ingredientQuantity;
    var ingredientUnit = req.body.ingredientUnit;
    
    var getPantry = `SELECT *
                     FROM pantry
                     WHERE userID = ${userID};`;
    var getPantrySize = `SELECT COUNT(*)
                         FROM pantry
                         WHERE userID = '${userID}';`;
    var method = req.body.method;
    var textJSON = "[";

    //Promise to prevent us from loading the page before the update is done
    const UPDATESTATUS = new Promise((resolve, reject) => {
        //Check to see if the ingredient exists in the database yet
        var ingredientsTable = `SELECT COUNT(*)
                                FROM ingredients
                                WHERE name = '${ingredientName}';`;
        db.any(ingredientsTable)
            .then(exists => {
                if (exists[0].count == 0) { //The ingredient doesn't already exist in the ingredients table
                    //Add the ingredient
                    var addIng = `INSERT INTO ingredients (name)
                                  VALUES ('${ingredientName}');`
                    var insTest = `SELECT *
                                   FROM ingredients;`; //For testing
                    db.task('insert-and-check', task => {
                        return task.batch([
                            task.any(addIng),
                            task.any(insTest)
                        ]);
                    })
                        .then(newIngTable => { //For debug to check if the info was correctly inserted
                            //console.log("Full Result: ", newIngTable);
                            //console.log("Insert Result: ", newIngTable[0]);
                            //console.log("Insert Test: ", newIngTable[1]);
                        })
                        .catch(error => { //Error occured, Reject the Promise
                            res.send(error);
                            reject(error);
                        })
                }

                //Grab the ingredientID
                var ingIDQuery = `SELECT ingredientID
                                  FROM ingredients
                                  WHERE name = '${ingredientName}';`;
                db.any(ingIDQuery)
                    .then(ingID => {
                        //Check if the ingredient is in the pantry yet
                        var ingredientID = ingID[0].ingredientid;
                        var pantryCheck = `SELECT COUNT(*)
                                           FROM pantry
                                           WHERE userID = '${userID}'
                                             AND ingredientID = '${ingredientID}';`;

                        db.any(pantryCheck)
                            .then(inPantry => {
                                if (inPantry[0].count == 0) {//Ingredient isn't in the pantry
                                    if (method === "add") { //Adding the ingredient
                                        var pantryInsert = `INSERT INTO pantry(userID, ingredientID, quantity, units)
                                                            VALUES ('${userID}', '${ingredientID}',
                                                                    '${ingredientQuantity}', '${ingredientUnit}')`;
                                        db.any(pantryInsert)
                                            .then(newPantry => { //Resolve the promise
                                                resolve("New Item Added");
                                            })
                                            .catch(error => { //Error occured, Reject the Promise
                                                res.send(error);
                                                reject(error);
                                            })
                                    }
                                    if (method === "del") { //Deleting the ingredient
                                        console.log("That item is not in your pantry");
                                        resolve("Item is not in pantry");
                                    }

                                } else { //Ingredient in the pantry
                                    // Grab the contents of the users pantry
                                    var preLoadPantry = `SELECT *
                                                         FROM pantry
                                                         WHERE userID = '${userID}'
                                                           AND ingredientID = '${ingredientID}'
                                                         LIMIT 1;`;

                                    db.any(preLoadPantry)
                                        .then(prePantry => { //Pantry info loaded
                                            // Grab the size of the pantry
                                            var pantryQuantity = prePantry[0].quantity;
                                            if (method === "add") {//Adding items to the pantry variable
                                                pantryQuantity = Number(pantryQuantity) + Number(ingredientQuantity);
                                            }
                                            if (method === "del") {//Deleting items from the pantry variable
                                                pantryQuantity = Number(pantryQuantity) - Number(ingredientQuantity);
                                                if (pantryQuantity < 0) {//Ensure that you never show a negative number
                                                    pantryQuantity = 0;
                                                }
                                            }

                                            //Update the pantry
                                            var pantryUpdate = `UPDATE pantry
                                                                SET quantity = '${pantryQuantity}'
                                                                WHERE userID = '${userID}'
                                                                  AND ingredientID = '${ingredientID}';`;
                                            db.task('update-and-get', task => { //Update the pantry and grab the new values
                                                return task.batch([
                                                    task.any(pantryUpdate),
                                                    task.any(getPantry)
                                                ]);
                                            })
                                                .then(postPantry => { //postgreSQL statements were successful
                                                    resolve("Updated Existing Item In Pantry");
                                                })
                                                .catch(error => { //pstgreSQL stantments failed
                                                    res.send(error);
                                                    reject(error);
                                                })
                                        })
                                        .catch(error => {
                                            res.send(error);
                                            reject(error);
                                        })
                                }
                            })
                            .catch(error => {
                                res.send(error);
                                reject(error);
                            })
                    })
                    .catch(error => {
                        res.send(error);
                        reject(error);
                    })
            })
            .catch(error => {
                res.send(error);
                reject(error);
            })
    })

    //Broken into pieces to help with js async nature
    const updateDone = () => {
        UPDATESTATUS
            .then(resMsg => {
                //Generate a JSON for the pantry page to read
                db.task("JSON-info", task => {
                    return task.batch([
                        task.any(getPantrySize),
                        task.any(getPantry)
                    ]);
                })
                    .then(info => { //Pantry information loaded
                        //Grab pantry size
                        var pantrySize = Number(info[0][0].count);
                        
                        var gather = new Promise((resolve, reject) => { //Needed to make sure that the code resolves in the correct order
                            var index = 0;
                            if (pantrySize > 0) {
                                info[1].forEach((ele) => {
                                    getIngrName = `SELECT name
                                                   FROM ingredients
                                                   WHERE ingredientID = '${ele.ingredientid}';`;
                                    db.any(getIngrName)
                                        .then(ingrName => {
                                            if (index > 0) { //Adding a comma between JSON items
                                                textJSON = textJSON + ",";
                                            }
                                            //Add the next ingredient
                                            textJSON = textJSON + `{"name":"${ingrName[0].name}","quantity":"${ele.quantity}"}`;
                                            if (index === pantrySize - 1) { //Resolve the promise when the full pantry is added
                                                resolve(textJSON);
                                            } else {
                                                index += 1;
                                            }
                                        })
                                        .catch(error => { //Error happened, reject the promise
                                            console.log("Inside JSON inner catch");
                                            console.log(error);
                                        })
                                });
                            } else { //Nothing is in the pantry
                                resolve('Pantry is Empty');
                            }
                        })

                        gather.then(() => { //Calls gather
                            //Add closing bracket and convert to a JSON
                            textJSON = textJSON + "]";
                            var pantryJSON = JSON.parse(textJSON);
                            //console.log("pantryJSON: ", pantryJSON);
                            res.render('pages/pantry', {//Render the pantry page
                                pantry: pantryJSON
                            });
                        })
                    })
                    .catch(error => {
                        console.log(error);
                    })
            })
            .catch(error => {
                res.log(error);
            })
    }

    //Calls update done to start the process of loading the pantry page
    updateDone();
});

/**
 * Grocery list get request. If there are saved recipes, creates and renders the grocery list.
 * If a user is logged in, mark items in their pantry as checked.
 *
 * @author Jocelyn McHugo
 */
app.get('/grocery_list', function (req, res) {
    var id = req.cookies.userID; // get the current user
    var savedRecipes = [];
    if (req.cookies.savedRecipes) { // there are saved recipes
        // convert cookie string of saved recipes into array of saved recipes
        req.cookies.savedRecipes.toString().replace(/^\[{+/, '').replace(/}]+$/, '').replace(/'/g, '"').split('},{"name":').forEach(recipeStr => {
            if (recipeStr.startsWith('"name"')) {
                savedRecipes.push(JSON.parse('{' + recipeStr + '}'));
            } else {
                savedRecipes.push(JSON.parse('{"name":' + recipeStr + '}'));
            }
        });
        var groceries = []; // grocery list in the format of [{item, quantity, unit, recipe, recipeLink, checked}]
        savedRecipes.forEach(recipe => { // iterate through saved recipe array
            // convert each ingredient in the recipe into a JSON object and push it to the grocery list
            recipe.ingredients.replace(/^\[{+/, '').replace(/}]+$/, '').replace(/~/g, '"').split('},{').forEach(ingredientStr => {
                var ingredient = JSON.parse('{' + ingredientStr + '}');
                groceries.push({
                    item: ingredient.item,
                    quantity: ingredient.amt,
                    unit: ingredient.unit,
                    recipe: recipe.name,
                    recipeLink: recipe.url,
                    checked: false
                });
            })
        })
        if (id >= 0) { // a user is logged in
            var pantry = `SELECT name
                          FROM ingredients
                                   INNER JOIN pantry ON ingredients.ingredientID = pantry.ingredientID
                          WHERE pantry.userID = ${id};`; // query to get the user's pantry items
            db.any(pantry) // get the user's pantry items
                .then(function (rows) {
                    rows.forEach(pantryIngredient => { // iterate through pantry
                        groceries.forEach(grocery => { // iterate through groceries
                            if (grocery.item === pantryIngredient.name) { // pantry item is on grocery list
                                grocery.checked = true; // check item
                            }
                        })
                    })
                    // render page with grocery list
                    res.render('pages/grocery_list', {
                        data: groceries
                    })
                })
                .catch(function (err) {
                    // display error message in case of an error
                    console.log('error', err);
                    res.render('pages/grocery_list', {
                        data: '' // render page with no data
                    })
                })
        } else {
            // render page with groceries
            res.render('pages/grocery_list', {
                data: groceries
            })
        }
    } else {
        // render page blank
        res.render('pages/grocery_list', {data: ''});
    }
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});