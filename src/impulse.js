var Impulse = function(threat,origin, target, threatDistance, shootMass,split, name, color) {
	this.threat = threat;
	this.origin = origin;
	this.target = target;
	this.threatDistance = threatDistance;
	this.shootMass = shootMass;
	this.split = split;
	this.label=name;
	this.color=color;
};
Impulse.prototype = {
	threat: 0,
	target: null,
	origin: null,
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