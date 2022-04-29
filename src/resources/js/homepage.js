document.getElementById("signupBtn").addEventListener("mouseover", mouseOver);
document.getElementById("signupBtn").addEventListener("mouseout", mouseOut);

document.getElementById("loginBtn").addEventListener("mouseover", mouseOver);
document.getElementById("loginBtn").addEventListener("mouseout", mouseOut);

function mouseOver() {
    document.getElementById("signupBtn").addEventListener("mouseover", mouseOver);
    document.getElementById("signupBtn").style.color = "green";
}
  
  function mouseOut() {
    document.getElementById("signupBtn").style.color = "blue";
}

function mouseOver() {
    document.getElementById("loginBtn").style.color = "green";
}
  
function mouseOut() {
    document.getElementById("loginBtn").style.color = "blue";
}