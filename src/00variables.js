var closestEnemy = 999999;
var closestEnemySize = 10;
var closestEnemyName = "";
var lastSize = 10;
var runOnce = false;
var aggressive = false;
var smartShoot = false;
var dontSplit = false;
window.botEnabled = true;
window.botOverride = false;
var friendList = [];
var enemyList = [];
var feedList = [ "BotKnowsBest" ];
var keyControls = true;

Array.prototype.remove = function() {
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};