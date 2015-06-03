function printImpulseLog(impulses, bot) {
	var miscStatString = "";
	var moveDistance = 0;
	var moveDirection = 0;
	var gap = -1;
	for (var i = 0; i <impulses.length; i++) {
		var impulse = impulses[i];

		if (impulses.length == 1) {
			if (impulse.threat > -1) {
				moveDirection = sanitizeDegrees(impulse.direction + 180);
			} else {
				moveDirection = impulse.direction;
			}
		} else {
			var currentGap = -1;
			if (i == 0) {
				currentGap = getAngleDifference(impulse.direction, impulses[impulses.length - 1].direction);
			} else {
				currentGap = getAngleDifference(impulse.direction, impulses[i - 1].direction);
			}
			var isNewGap = currentGap == -1 ||
				(impulse.threat > -1 && currentGap > gap) ||
				(impulse.threat < 0 && currentGap < gap);
			if (isNewGap) {
				gap = currentGap;
				if (i == 0) {
					moveDirection = sanitizeDegrees(impulses[impulses.length - 1].direction + currentGap / 2);
				} else {
					moveDirection = sanitizeDegrees(impulse.direction + currentGap / 2);
				}
			}
		}

		moveDistance = impulse.distance;
	}
	miscStatString += 'Direction: ' + Math.floor(moveDirection) +
	', Number: ' + impulses.length +
	', Gap: ' + Math.floor(gap) +
	'<br>';

	for (var i = 0; i < impulses.length; i++) {
		var impulse = impulses[i];

		var currentColor = 'blue';
		if (impulse.threat > 0) {
			currentColor = 'red';
		} else {
			currentColor = 'green';
		}
		miscStatString += "<span style='color:" + currentColor + "'>" + impulse.enemy.name + "(" + Math.floor(impulse.enemy.mass) + ")</span>: ";

		if (impulse.distance < impulse.worryDistance) {
			currentColor = 'red';
		} else {
			currentColor = 'green';
		}
		miscStatString += 'dir:' + Math.floor(impulse.direction) + ', <span style="color:' +
			currentColor + ';">' + Math.floor(impulse.distance) + '</span>(' + Math.floor(impulse.worryDistance) +
			'), threat: ' + Math.floor(impulse.threat) + '<br>';
	}
	$miscStat.html(miscStatString);
}