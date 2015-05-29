var MyOrganism = function(myOrganisms) {
	if (myOrganisms.length < 1) {
		return;
	}

	var largestMass = 0;
	var largestOrganism = null;
	for (var i=0; i< myOrganisms.length; i++) {
		var organism = myOrganisms[i];
		this.ox += organism.ox;
		this.oy += organism.oy;

		if(organism.x2){
			organism.dx=organism.x-organism.x2
		}
		if(organism.y2){
			organism.dy=organism.y-organism.y2
		}
		organism.x2=organism.x;
		organism.y2=organism.y;
		organism.mass = getMass(organism.size);
		organism.direction = getDirection(organism);
		organism.speed = getSpeed(organism);

		this.mass += organism.mass;
		if (largestMass < organism.mass) {
			largestMass = organism.mass;
			largestOrganism = organism;
		}
	}

	this.organisms = myOrganisms;
	if (largestOrganism == null) {
		return;
	}
	this.ox = this.ox / myOrganisms.length;
	this.oy = this.oy / myOrganisms.length;
	this.dx = largestOrganism.dx;
	this.dy = largestOrganism.dy;
	this.speed = getSpeed(this);
	this.direction = getDirection({ox: largestOrganism.ox, oy: largestOrganism.oy, dx: largestOrganism.dx, dy: largestOrganism.dy});

	var farthest = -1;
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