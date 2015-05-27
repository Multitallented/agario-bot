var MyOrganism = function(myOrganisms) {
	this.organisms = myOrganisms;
	if (myOrganisms.length < 1) {
		return;
	}

	var largestMass = 0;
	var largestOrganism = null;
	for (var i=0; i< myOrganisms.length; i++) {
		var organism = myOrganisms[i];
		this.ox += organism.ox;
		this.oy += organism.oy;

		organism.mass = getMass(organism.size);
		organism.speed = getSpeed(organism);
		organism.direction = getDirection(organism);
		this.mass += organism.mass;
		if (largestMass < organism.mass) {
			largestMass = organism.mass;
			largestOrganism = organism;
		}
	}
	if (largestOrganism == null) {
		return;
	}
	this.ox = this.ox / myOrganisms.length;
	this.oy = this.oy / myOrganisms.length;
	this.dx = largestOrganism.dx;
	this.dy = largestOrganism.dy;
	this.speed = getSpeed(this);
	this.direction = getDirection(this);

	var farthest = 0;
	var farthestSize = 0;
	for (var i=0; i< myOrganisms.length; i++) {
		var organism = myOrganisms[i];
		var currentDistance = distance(organism, {ox: this.ox, oy: this.oy});
		if (currentDistance > farthest) {
			farthest = currentDistance;
			farthestSize = organism.size;
		}
	}
	this.size = farthest + farthestSize;
};
MyOrganism.prototype = {
	organisms: [],
	size: 10,
	mass: 10,
	ox: 0,
	oy: 0,
	dx: 0,
	dy: 0,
	speed: 0,
	direction: 0
};