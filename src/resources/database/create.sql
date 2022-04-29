CREATE TABLE IF NOT EXISTS bad_ingredients -- linking table for bad ingredients
(
    ingredientID INT NOT NULL,
    userID       INT NOT NULL,
    PRIMARY KEY (ingredientID, userID)
);

CREATE TABLE IF NOT EXISTS ingredients -- possible ingredients to add to pantries
(
    ingredientID SERIAL PRIMARY KEY NOT NULL, -- autogenerated id
    name         VARCHAR(100)       NOT NULL, -- user-inputted name
    allergies    VARCHAR(100)[]               -- list of allergies associated with ingredient (ex. the ingredient "milk" would have "dairy" in its allergies array)
);


CREATE TABLE IF NOT EXISTS pantry -- linking table for user ingredients
(
    userID       INT NOT NULL,
    dateAdded    DATE,
    ingredientID INT NOT NULL,
    quantity     INT,
    units        VARCHAR(100),
    PRIMARY KEY (userID, ingredientID) -- TODO determine if this needs to include another column
);


CREATE TABLE IF NOT EXISTS users
(
    id       BIGSERIAL PRIMARY KEY NOT NULL,
    name     VARCHAR(200)          NOT NULL,
    email    VARCHAR(200)          NOT NULL,
    password VARCHAR(256)          NOT NULL,
    UNIQUE (email)
);
