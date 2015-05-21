var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
	this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.considerations)
};
Bot.prototype = {
	impulses: [],
	pressingButton: false,
	largestSelf: 10,
	totalSize: 10,
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	dodgeDistance: 100,
	onTick: function (organisms, myOrganisms, score) {
		//Check Dead
		if (myOrganisms.length<1) {
			if(this.currentState!='dead'){
				this.gameHistory.push([
					this.lastStateChangeDate,
					new Date,
					this.scoreHistory
				]);

				console.log("DEAD x_X");
				console.log("Score",~~(this.scoreHistory[this.scoreHistory.length-1]/100))
				console.log("Time spent alive",(Date.now()-this.lastStateChangeDate.getTime())/60000,"mins")
				this.scoreHistory=[];
				this.lastStateChangeDate=new Date
			}
			this.currentState='dead';
			return;
		}
		if (this.currentState!='alive'){
			this.lastStateChangeDate=new Date;
		}
		if(!(this.scoreHistory.length%10)){
			var j=0;
			for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
				/*
				 if(j){
				 chart.datasets[0].points[j].value=~~((this.scoreHistory[i]-this.scoreHistory[i-1])/100)
				 }
				 j++
				 */
				chart.datasets[0].points[j++].value=~~(this.scoreHistory[i]/100)
			}

			j=0
			for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
				var gameStats=this.gameHistory[i];
				chart.datasets[1].points[10*j++].value=~~(gameStats[2][gameStats[2].length-1]/100)
			}
			chart.update()
		}


		var myOrganism=myOrganisms[0],
			otherOrganisms=organisms.filter(function(organism){
				if(organism.x2){
					organism.dx=organism.x-organism.x2
				}
				if(organism.y2){
					organism.dy=organism.y-organism.y2
				}
				organism.x2=organism.x;
				organism.y2=organism.y;
				return myOrganisms.indexOf(organism)==-1
			});

		//Find largest size
		this.largestSelf = 10;
		this.totalSize = 0;
		for (var i=0;i<myOrganisms; i++) {
			this.totalSize += myOrganisms[i].size;
			this.largestSelf = Math.max(this.largestSelf, myOrganisms[i].size);
		}

		//Find all immediate threats/opportunities
		this.impulses=[];
		for (var i=0;i<otherOrganisms.length;i++) {
			var organism=otherOrganisms[i];
			var impulse = withinThreatRange(myOrganisms, organism, this.totalSize, this.dodgeDistance);
			if (impulse != null) {
				this.impulses.push(impulse);
			}
		}
		//Take action on immediate impulses if needed
		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];

		}

	}
};

//Check if enemy is a threat/opportunity
function withinThreatRange(myOrganisms, organism, totalSize, dodgeDistance) {
	var threat = 0;
	var shouldSplit = false;
	var shouldShootMass = false;

	for (var i=0;i<myOrganisms.length;i++) {

		//Calc if organism is a threat, and if so, then at what range should I be worried
		var threatDistance = 9999999;
		if (!organism.isVirus) {

			//Can he eat me?
			if (canBeEaten(myOrganisms[i], organism)) {

				//Can he split to eat me? Would it be worth it to him?
				if (!canBeSplitEaten(myOrganisms[i], organism) || totalSize * 4.5 > organism.size) {
					threatDistance = distanceTilConsumption(myOrganisms[i], organism);
				} else {
					threatDistance = calcSplitDistance(organism);
				}
			}

		//Can I eat this virus?
		} else if (canBeEaten(organism, myOrganisms[i])) {
			threatDistance = distanceTilConsumption();
		}

		//Am I in danger of being eaten
		var currentThreatDistance = distance(myOrganism[i], organism);
		if (organism.isVirus && currentThreatDistance < threatDistance + dodgeDistance / 4) {

			//Can I safely eat this virus?
			if (myOrganisms.length < 16) {
				threat += myOrganisms[i].size * 0.6;
			} else if (threat == 0) {
				threat -= organism.size;
			}
		} else if (currentThreatDistance < threatDistance + dodgeDistance) {
			threat += myOrganisms[i].size;

			//Should I split to avoid this?
			if (currentThreatDistance < threatDistance + dodgeDistance / 2) {
				shouldSplit = true;
			}
		}
	}

	//If not a threat, then can I eat it?
	if (threat < 1) {
		//Is it a non-edible virus?
		if ((organism.isVirus && myOrganisms.length < 16)) {
			return null;
		}

		//Can I safely eat it?

		//Find closest of my organisms
		var shortestDistance = distance(organism, myOrganisms[0]);
		var closestOfMyOrganisms = myOrganisms[0];
		for (var i=1;i<myOrganisms.length; i++) {
			var currentOrganism = myOrganisms[i];
			var currentDistance = distance(organism, currentOrganism);
			if (currentDistance < shortestDistance) {
				closestOfMyOrganisms = currentOrganism;
				shortestDistance = currentDistance;
			}
		}

		//Can I eat it?
		if (canBeEaten(organism, closestOfMyOrganisms)) {

			//Can I split to eat it?
			if (totalSize > 200 && canBeSplitEaten(organism, closestOfMyOrganisms)) {

				//Is it within range?
				var splitDistance = calcSplitDistance(closestOfMyOrganisms);
				if (splitDistance + dodgeDistance * 2 > shortestDistance) {
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - splitDistance) * organism.size));

					if (splitDistance > shortestDistance && myOrganisms.length < 16) {
						shouldSplit = true;
					}
				}

			} else {

				//Is it within range without splitting?
				var consumptionDistance = distanceTilConsumption(closestOfMyOrganisms, organism);
				if (shortestDistance < consumptionDistance + dodgeDistance) {
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - consumptionDistance) * organism.size));
				}
			}
		}
	}
	if (threat != 0) {
		return new Impulse(threat, organism.x, organism.y, shouldShootMass, shouldSplit);
	} else {
		return null;
	}
}

function distance(organism1, organism2) {
	return Math.sqrt((organism1.x - organism2.x) * (organism1.y - organism2.y));
}
function calcSplitDistance(organism) {
	return organism.size * 3.5 - organism.size / 2000;
}
function distanceTilConsumption(myOrganism, otherOrganism) {
	if (otherOrganism.isVirus && !canBeEaten(otherOrganism, myOrganism)) {
		return -1;
	}
	//TODO fix this
	return distance(myOrganism, otherOrganism) - ;
}
function canBeSplitEaten(food, eater) {
	return food.size * 1.1 < eater.size / 2;
}
function canBeEaten(food, eater) {
	return food.size * 1.1 < eater.size;
}

var Impulse = function(weight,x,y,shootMass,split) {
	this.weight = weight;
	this.x = x;
	this.y = y;
	this.shootMass = shootMass;
	this.split = split;
};
Impulse.prototype = {
	weight: 0,
	x: 0,
	y: 0,
	shootMass: false,
	split: false
};

var Consideration=function(label,consider,weight,color){
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.consider=consider;
};

Consideration.prototype={
	weight:1,
	label:'',
	color:'',
	get value(){
		return this.weight;
	}
};

var chart=new Chart(ctx).Line({labels:labels,datasets:[{
	label: "Score History",
	fillColor: "rgba(220,220,220,0.2)",
	strokeColor: "rgba(220,220,220,1)",
	data: data1
},
	{
		label: "Game History",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]});