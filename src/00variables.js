var closestEnemy = 999999;
var closestEnemySize = 10;
var closestEnemyName = "";
var lastSize = 10;
var runOnce = false;
window.botEnabled = true;

document.onkeypress = function(e) {
    console.log(e.keyCode);
    if (e.keyCode == 103) {
        runOnce = true;
    }
};