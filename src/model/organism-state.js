var OrganismState = function(myOrganisms, organisms) {
	this.otherOrganisms=organisms;

	for(var i=0; i<this.otherOrganisms.length; i++) {
		var organism = this.otherOrganisms[i];
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
	}
	var skittles = this.skittles = this.otherOrganisms.filter(function(organism) {
		if (organism.mass < 9) {
			organism.name = "skittle";
		}
		return organism.mass < 9;
	});
	this.viruses = this.otherOrganisms.filter(function(organism) {
		if (organism.isVirus) {
			organism.name = "virus";
		}
		return organism.isVirus;
	});
	this.enemies = this.otherOrganisms.filter(function(organism) {
		return !organism.isVirus && organism.mass > 9;
	});
	this.organisms = organisms;
};
OrganismState.prototype = {
	otherOrganisms: [],
	skittles: [],
	viruses: [],
	enemies: [],
	organisms: []
};