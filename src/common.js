function getDirection(organism) {
	return toDegrees(organism.ox, organism.oy, organism.dx, organism.dy);
}
function getSpeed(organism) {
	return distance(organism, {ox: organism.dx, oy: organism.dy});
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
	if (myOrganism.ox < worryDistance) {
		return new Impulse(999999, {name: 'Left Edge', ox: 0, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.ox, worryDistance, 180, 'Left Edge', '#FF0000');
	} else if (myOrganism.oy < worryDistance) {
		return new Impulse(999999, {name: 'Top Edge', ox: myOrganism.ox, oy: 0, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, myOrganism.oy, worryDistance, 270, 'Top Edge', '#FF0000');
	} else if (myOrganism.ox > 11200 - worryDistance) {
		return new Impulse(999999, {name: 'Right Edge', ox: 11200, oy: myOrganism.oy, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.ox, worryDistance, 270, 'Right Edge', '#FF0000');
	} else if (myOrganism.oy > 11200 - worryDistance) {
		return new Impulse(999999, {name: 'Bottom Edge', ox: myOrganism.ox, oy: 11200, dx: 0, dy: 0, mass: 999999}, myOrganism.organisms, 11200 - myOrganism.oy, worryDistance, 270, 'Bottom Edge', '#FF0000');
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
	return eater.size - food.size;
}
function calcSplitDistance(food, eater) {
	var eaterDiameter = getDiameter(eater.size);
	var splitDistance = eaterDiameter * (3.5 - eaterDiameter / 800) + 250;
	var splitSize = eaterDiameter / 2;

	var foodDiameter = getDiameter(food.size);
	var sizePercentage = foodDiameter / splitSize;
	var consumptionDistance = (splitSize / 2 + foodDiameter / 2 - sizePercentage * splitSize / 2) * 2.1;
	return splitDistance - consumptionDistance;

}
function consumptionDistance(food, eater) {
	if ((eater.isVirus && !canBeEaten(eater, food))
			|| (eater.isVirus && !canBeEaten(food, eater))) {
		return -1;
	}
	return getRadius(eater.size);
}
function canBeSplitEaten(food, eater) {
	return food.mass * 1.15 < eater.mass / 2;
}
function canBeEaten(food, eater) {
	return eater.mass - food.mass > 10 && food.mass * 1.15 < eater.mass;
}