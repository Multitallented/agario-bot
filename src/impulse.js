var Impulse = function(threat,x,y, threatDistance, shootMass,split, name, color) {
	this.threat = threat;
	this.x = x;
	this.y = y;
	this.threatDistance = threatDistance;
	this.shootMass = shootMass;
	this.split = split;
	this.label=name;
	this.color=color;
};
Impulse.prototype = {
	threat: 0,
	x: 0,
	y: 0,
	threatDistance: 999999,
	shootMass: false,
	split: false,
	name: 'Idling',
	label: '',
	color: '',
	get value(){
		return this.threat;
	}
};