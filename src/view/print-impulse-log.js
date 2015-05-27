function printImpulseLog(impulses) {
	var miscStatString = "";
	for (var i = 0; i < impulses.length; i++) {
		var currentImpulse = impulses[i];
		if (currentImpulse.threat == -1 || currentImpulse.threat == 0) {
			continue;
		}
		var currentColor = 'blue';
		if (currentImpulse.threat > 0) {
			currentColor = 'red';
		} else {
			currentColor = 'green';
		}
		miscStatString += "<span style='color:" + currentColor + "'>" + currentImpulse.enemy.name + "</span>: ";

		if (currentImpulse.distance < currentImpulse.worryDistance) {
			currentColor = 'red';
		} else {
			currentColor = 'green';
		}
		miscStatString += 'dir:' + currentImpulse.direction + ', <span style="color:' +
			currentColor + ';">' + currentImpulse.distance + '</span>(' + currentImpulse.worryDistance +
			'), threat: ' + currentImpulse.threat + '<br>';
	}
	$miscStat.html(miscStatString);
}