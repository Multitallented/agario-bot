function filterArrays(myOrganisms, organisms) {
	
	otherOrganisms=organisms.filter(function(organism){
			if(organism.x2){
				organism.dx=organism.x-organism.x2
			}
			if(organism.y2){
				organism.dy=organism.y-organism.y2
			}
			organism.x2=organism.x;
			organism.y2=organism.y;
			return myOrganisms.indexOf(organism)==-1;
		});
	afkMass = otherOrganisms.filter(function(organism) {
		return organism.name == "" && !organism.isVirus && organism.size > 15 && organism.dx == 0;
	});
	skittles = otherOrganisms.filter(function(organism) {
		return organism.name == "" && !organism.isVirus && organism.size < 15 && organism.dx == 0;
	});
	viruses = otherOrganisms.filter(function(organism)) {
		return organism.isVirus;
	}
	enemies = otherOrganisms.filter(function(organism) {
		return !organism.isVirus && afkMass.indexOf(organism)==-1 && skittles.indexOf(organism)==-1;
	});
	this.otherOrganisms = otherOrganisms;
}