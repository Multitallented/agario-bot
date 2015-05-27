var OrganismState = function(myOrganisms, organisms) {
	this.otherOrganisms=organisms.filter(function(organism){
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
		return myOrganisms.indexOf(organism)==-1;
	});
	this.skittles = otherOrganisms.filter(function(organism) {
		return organism.name == "" && !organism.isVirus && organism.size < 15 && organism.dx == 0;
	});
	this.viruses = otherOrganisms.filter(function(organism) {
		return organism.isVirus;
	});
	this.enemies = otherOrganisms.filter(function(organism) {
		return !organism.isVirus && skittles.indexOf(organism)==-1;
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