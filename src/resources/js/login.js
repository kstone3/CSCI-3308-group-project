/**
 * Main modal control function.
 *
 * @author Kieran Stone
 */
function openModal() {
    // document elements
    var myInput = document.getElementById("psw");
    var confirmMyInput = document.getElementById("cpsw");
    var letter = document.getElementById("letter");
    var capital = document.getElementById("capital");
    var number = document.getElementById("number");
    var symbol = document.getElementById("symbol");
    var length = document.getElementById("length");
    var match = document.getElementById("match");

    // when password entered
    myInput.onkeyup = function () {

        // regex patterns
        var lowerCaseLetters = /[a-z]/g;
        var upperCaseLetters = /[A-Z]/g;
        var numbers = /[0-9]/g;
        var symbols = /\W/g;
        var minLength = 12;

        // validate lowercase letters
        if (myInput.value.match(lowerCaseLetters)) {
            letter.classList.remove("invalid");
            letter.classList.add("valid");
        } else {
            letter.classList.remove("valid");
            letter.classList.add("invalid");
        }

        // validate capital letters
        if (myInput.value.match(upperCaseLetters)) {
            capital.classList.remove("invalid");
            capital.classList.add("valid");
        } else {
            capital.classList.remove("valid");
            capital.classList.add("invalid");
        }

        // validate numbers
        if (myInput.value.match(numbers)) {
            number.classList.remove("invalid");
            number.classList.add("valid");
        } else {
            number.classList.remove("valid");
            number.classList.add("invalid");
        }

        // validate symbols
        if (myInput.value.match(symbols)) {
            symbol.classList.remove("invalid");
            symbol.classList.add("valid");
        } else {
            symbol.classList.remove("valid");
            symbol.classList.add("invalid");
        }

        // validate length
        if (myInput.value.length >= minLength) {
            length.classList.remove("invalid");
            length.classList.add("valid");
        } else {
            length.classList.remove("valid");
            length.classList.add("invalid");
        }
    };
    ;
    confirmMyInput.onkeyup = function () {
        // validate password and confirmPassword
        var passEqualsConfPass = myInput.value === confirmMyInput.value;
        if (passEqualsConfPass) {
            match.classList.remove("invalid");
            match.classList.add("valid");
        } else {
            match.classList.remove("valid");
            match.classList.add("invalid");
        }

        // Disable or Enable the button based on the elements in classList
        enableButton(letter, capital, number, length, match);
    };
}

/**
 * Determines if submit button is enabled or disabled
 *
 * @author Kieran Stone
 *
 * @param letter letter document element
 * @param capital capital document element
 * @param number number document element
 * @param length length document element
 * @param match match document element
 */
function enableButton(letter, capital, number, length, match) {
    var button = document.getElementById("my_submit_button"); // submit button
    // check that all elements are valid
    var condition = letter.classList.contains("valid") && capital.classList.contains("valid") && number.classList.contains("valid") && length.classList.contains("valid") && match.classList.contains("valid");
    if (condition) {
        button.disabled = false; // endable button
    }
}

/**
 * Submit the registration form
 *
 * @author Kieran Stone
 */
function addedUser() {
    document.getElementById("registerForm").submit();
}