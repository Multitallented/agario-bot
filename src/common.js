function getDirection(organism) {
	return toDegrees(organism.ox, organism.oy, organism.dx, organism.dy);
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
	var worryDistance = myOrganism.speed * 2;
	var threatDistance = myOrganism.size * 8;
	if (myOrganism.ox < threatDistance) {
		return new Impulse(999999, {name: 'Left Edge', ox: 0, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.ox, worryDistance, 180, 'Left Edge', '#FF0000');
	} else if (myOrganism.oy < threatDistance) {
		return new Impulse(999999, {name: 'Top Edge', ox: myOrganism.ox, oy: 0, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.oy, worryDistance, 270, 'Top Edge', '#FF0000');
	} else if (myOrganism.ox > 11200 - threatDistance) {
		return new Impulse(999999, {name: 'Right Edge', ox: 11200, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.ox, worryDistance, 0, 'Right Edge', '#FF0000');
	} else if (myOrganism.oy > 11200 - threatDistance) {
		return new Impulse(999999, {name: 'Bottom Edge', ox: myOrganism.ox, oy: 11200, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.oy, worryDistance, 90, 'Bottom Edge', '#FF0000');
	}
}
function isTravelingTowardsMe(food, eater) {
	var tolerance = 30;
	var enemyVector = toDegrees(eater.dx, eater.dy, eater.ox, eater.oy);
	var enemyDirection = toDegrees(food.ox, food.oy, eater.ox, eater.oy);
	return Math.abs(enemyVector - enemyDirection) < tolerance || Math.abs(Math.min(enemyVector, enemyDirection) + 360 - Math.max(enemyDirection, enemyVector)) < tolerance;
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
	return eater.size * (5 - eater.size / 400) + 250;
}
function getConsumeDistance(food, eater) {
	return eater.size;
}
function canBeSplitEaten(food, eater) {
	return food.mass * 1.15 < eater.mass / 2;
}
function canBeEaten(food, eater) {
	return eater.mass - food.mass > 10 && food.mass * 1.15 < eater.mass;
}