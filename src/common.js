function getDirection(organism) {
	return toDegrees(organism.ox, organism.oy, organism.dx + organism.ox, organism.dy + organism.oy);
}
function getSpeed(organism) {
	return distance(organism, {ox: organism.dx + organism.ox, oy: organism.dy + organism.oy});
}
function getAngleDifference(angle1, angle2) {
	var difference = Math.abs(angle1 - angle2);
	return difference > 180 ? 360 - difference : difference;
}
function tooBigToWorry(food, eater) {
	return food.mass * 6 < eater.mass;
}
function getMass(size) {
	return Math.pow(size, 2) / 100;
}
function createEdgeThreat(myOrganism) {
	var worryDistance = myOrganism.size + myOrganism.speed + 10;
	var threatDistance = myOrganism.size * 2 + 660;
	var threatArray = [];
	if (myOrganism.ox < threatDistance) {
		threatArray.push(new Impulse(999999, {name: 'Left Edge', ox: 0, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.ox, worryDistance, 180, 'Left Edge', '#FF0000'));
	}
	if (myOrganism.oy < threatDistance) {
		threatArray.push(new Impulse(999999, {name: 'Top Edge', ox: myOrganism.ox, oy: 0, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.oy, worryDistance, 270, 'Top Edge', '#FF0000'));
	}
	if (myOrganism.ox > 11200 - threatDistance) {
		threatArray.push(new Impulse(999999, {name: 'Right Edge', ox: 11200, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.ox, worryDistance, 0, 'Right Edge', '#FF0000'));
	}
	if (myOrganism.oy > 11200 - threatDistance) {
		threatArray.push(new Impulse(999999, {name: 'Bottom Edge', ox: myOrganism.ox, oy: 11200, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.oy, worryDistance, 90, 'Bottom Edge', '#FF0000'));
	}
	return threatArray;
}
function isTravelingTowardsMe(threatDirection, distance, eater) {
	var angleDifference = getAngleDifference(sanitizeDegrees(threatDirection + 180), eater.direction);
	var closestDistance = Math.sin(angleDifference) * distance;
	return closestDistance < eater.size;
}
function sanitizeDegrees(degrees) {
	while (degrees > 359) {
		degrees -= 360;
	}
	while (degrees < 0) {
		degrees += 360;
	}
	return degrees;
}
function getRelativeSpeed(food, eater) {
	var foodDirection = toDegrees(food.ox, food.oy, eater.ox, eater.oy);
	var relativeDirection = toDegrees(food.ox, food.oy, food.dx, food.dy);
	var directionDifference = getAngleDifference(foodDirection, relativeDirection);
	if (directionDifference == 90) {
		return 0;
	}
	if (directionDifference > 90) {
		return distance(food, {ox: food.dx, oy: food.dy}) * Math.cos(180 - directionDifference);
	}
	return distance(food, {ox: food.dx, oy: food.dy}) * Math.cos(directionDifference);
}
function toDegrees(baseX,baseY, x2, y2) {
	var deltaX = x2 - baseX;
	var deltaY = y2 - baseY;
	var rad = Math.atan2(deltaY, deltaX); // In radians
	return sanitizeDegrees(rad * (180 / Math.PI));
}
function toCoords(degrees, x, y, multiplier) {
	var coordinates = {x: x, y: y};
	coordinates.x += multiplier * Math.cos(degrees * Math.PI / 180);
	coordinates.y += multiplier * Math.sin(degrees * Math.PI / 180);
	return coordinates;
}
function distance(organism1, organism2) {
	return Math.sqrt(Math.pow(organism1.ox - organism2.ox, 2) + Math.pow(organism1.oy - organism2.oy, 2));
}
function getSplitDistance(eater) {
	//return eater.size * (3 - eater.size / 275) + 225;
	if (eater.size < 45) {
		return 600;
	}
	return 660;
}
function getConsumeDistance(food, eater) {
	return eater.size;
}
function canBeSplitEaten(food, eater) {
	return food.mass * 1.333 < eater.mass / 2;
}
function canBeSplitAttacked(food, eater) {
	return food.mass * 1.333 < eater.mass / 2;
}
function canBeEaten(food, eater) {
	return eater.mass - food.mass > 15 && food.mass * 1.22 < eater.mass;
}