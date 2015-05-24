function getMass(size) {
	return Math.pow(size, 2) / 100;
}
function getDiameter(size) {
	return size * 2;
}
function getRadius(size) {
	return size;
}
function getGeneralOrganism(myOrganisms, totalSize) {
	var myOrganism = {ox: 0, oy: 0, size: totalSize};
	for (var i=0; i< myOrganisms.length; i++) {
		myOrganism.ox += myOrganisms[i].ox;
		myOrganism.oy += myOrganisms[i].oy;
	}
	myOrganism.ox = myOrganism.ox / myOrganisms.length;
	myOrganism.oy = myOrganism.oy / myOrganisms.length;
	return myOrganism;
}
function createEdgeThreat(organism, totalSize, dodgeDistance) {
	var diameter = getDiameter(totalSize);
	if (organism.ox < dodgeDistance + diameter) {
		return new Impulse(getMass(totalSize) / 2, 0, organism.oy, dodgeDistance + diameter, false, false, 'Left Edge', '#FF0000');
	} else if (organism.oy < dodgeDistance + diameter) {
		return new Impulse(getMass(totalSize) / 2, organism.ox, 0, dodgeDistance + diameter, false, false, 'Top Edge', '#FF0000');
	} else if (organism.ox > 11200 - dodgeDistance - diameter) {
		return new Impulse(getMass(totalSize) / 2, 11200, organism.oy, dodgeDistance + diameter, false, false, 'Right Edge', '#FF0000');
	} else if (organism.oy > 11200 - dodgeDistance - diameter) {
		return new Impulse(getMass(totalSize) / 2, organism.ox, 11200, dodgeDistance + diameter, false, false, 'Bottom Edge', '#FF0000');
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
function toDegrees(x1,y1, x2, y2) {
	var deltaX = x2 - x1;
	var deltaY = y2 - y1;
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
	var foodMass = getMass(food.size);
	var eaterMass = getMass(eater.size);
	return foodMass * 1.15 < eaterMass / 2;
}
function canBeEaten(food, eater) {
	var foodMass = getMass(food.size);
	var eaterMass = getMass(eater.size);
	return eaterMass - foodMass > 10 && foodMass * 1.15 < eaterMass;
}