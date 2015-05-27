var Impulse = function(threat, enemy, target, distance, worryDistance, direction, label, color) {
	this.threat = threat;
	this.enemy = target;
	this.target = target;
	this.distance = distance;
	this.worryDistance = worryDistance;
	this.direction = direction;
	this.label=label;
	this.color=color;
};
Impulse.prototype = {
	threat: 0,
	enemy: null,
	target: [],
	distance: 999999,
	worryDistance: 0,
	direction: -1,
	label: 'Default',
	color: '#0000FF',
	get value(){
		return this.threat;
	}
};