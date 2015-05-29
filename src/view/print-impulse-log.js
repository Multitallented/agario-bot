function printImpulseLog(impulses, bot) {
	var miscStatString = "";
	var totalDirection = 0;
	var averageNumber = 0;
	for (var i = 0; i < impulses.length; i++) {
		var impulse = impulses[i];
		totalDirection += impulse.direction;
		averageNumber++;
	}
	miscStatString += 'Total Direction: ' + Math.floor(totalDirection) +
		', Number of Impulses: ' + averageNumber +
		', Outcome: ' + Math.floor(totalDirection / averageNumber) +
		'<br>';

	for (var i = 0; i < impulses.length; i++) {
		var impulse = impulses[i];

		var currentColor = 'blue';
		if (impulse.threat > 0) {
			currentColor = 'red';
		} else {
			currentColor = 'green';
		}
		miscStatString += "<span style='color:" + currentColor + "'>" + impulse.enemy.name + "</span>: ";

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