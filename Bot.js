var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
	this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.impulses);
};
var runOnce = true;
var lastLog = 101;
var pressingButton = window.pressingButton = false;
var attackSplitCooldown = 0;
var attackSplitWarmup = 0;
Bot.prototype = {
	impulses: [],
	largestSelf: 10,
	totalSize: 10,
	lastStateChangeDate:null,
	runOnce: true,
	gameHistory:[],
	scoreHistory:[],
	dodgeDistance: 150,
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

			j=0;
			for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
				var gameStats=this.gameHistory[i];
				chart.datasets[1].points[10*j++].value=~~(gameStats[2][gameStats[2].length-1]/100)
			}
			chart.update();
		}

		this.currentState='alive';


		this.impulses=[];
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
		var skittles = otherOrganisms.filter(function(organism) {
			return organism.name == "" && !organism.isVirus && organism.size < 15;
		});
		otherOrganisms = otherOrganisms.filter(function(organism) {
			return organism.size > 14;
		});
		if (myOrganism == undefined || myOrganism == null) {
			return;
		}


		if (attackSplitCooldown > 0) {
			attackSplitCooldown--;
		}
		if (attackSplitWarmup > 0) {
			attackSplitWarmup--;
		}
		//Find largest size
		this.largestSelf = 10;
		this.totalSize = 0;
		for (var i=0;i<myOrganisms.length; i++) {
			this.totalSize += myOrganisms[i].size;
			this.largestSelf = Math.max(this.largestSelf, myOrganisms[i].size);
		}

		//Find all immediate threats/opportunities
		for (var i=0;i<otherOrganisms.length;i++) {
			var organism=otherOrganisms[i];
			if (organism == undefined || organism == null) {
				continue;
			}
			var impulse = withinThreatRange(myOrganisms, organism, this.totalSize, this.dodgeDistance);
			if (impulse != null) {
				this.impulses.push(impulse);
			}
		}
		//Take action on immediate impulses if needed
		var absoluteTotalThreat = 0;
		var isThreatened = false;
		var currentEscapeDirection = -1;
		var shouldSplit = false;

		//Sort by biggest threat
		this.impulses.sort(function(a,b){
			return b.threat - a.threat;
		});

		if (this.impulses.length > 0 && this.impulses[0].threat > 0) {

			var edgeThreat = createEdgeThreat(myOrganism, this.totalSize, this.dodgeDistance);
			if (edgeThreat != undefined) {
				this.impulses.push(edgeThreat);
			}
		}

		var leastDistance = 999999;
		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];
			if (impulse.threat > 0) {
				isThreatened = true;
				if (impulse.split) {
					shouldSplit = true;
				}
				var currentDistance = distance({ox: impulse.x, oy: impulse.y}, myOrganism);
				if (currentDistance < leastDistance) {
					leastDistance = currentDistance;
				}
				//Get individual escape direction
				var newEscapeDirection = toDegrees(myOrganism.ox, myOrganism.oy, impulse.x, impulse.y)
				//Run away from the threat not towards it
				newEscapeDirection += 180;
				newEscapeDirection = sanitizeDegrees(newEscapeDirection);

				//Calc new escape direction
				if (currentEscapeDirection < 0) {
					currentEscapeDirection = newEscapeDirection;
				} else {
					var degreeDifference = Math.abs(newEscapeDirection - currentEscapeDirection);

					//adjust direction based on threat weight
					var weightedDifference = impulse.threat / absoluteTotalThreat * degreeDifference / 2;
					if (degreeDifference > 180) {
						currentEscapeDirection = Math.max(newEscapeDirection, currentEscapeDirection) + 360 - weightedDifference;
					} else {
						currentEscapeDirection = Math.min(newEscapeDirection, currentEscapeDirection) + weightedDifference;
					}
					currentEscapeDirection = sanitizeDegrees(currentEscapeDirection);
				}

			//ignore opportunities if threatened
			} else if (!isThreatened && impulse.threat < 0) {
				this.move(impulse.x, impulse.y);
				if (impulse.split && !pressingButton) {
					attackSplitCooldown = 80;
					pressingButton = true;
					setTimeout(function() {
						pressingButton = false;
					}, 80);
					this.split();
				}

				//Act on the biggest opportunity only
				//TODO update chart
				//this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.considerations);
				//this.behaviorChart.update();
				return;
			}

			//Weight subsequent actions based on threat
			absoluteTotalThreat += Math.abs(impulse.threat);
		}

		//Execute escape manuevers if threatened
		if (isThreatened && currentEscapeDirection > -1) {
			var escapeCoords = toCoords(currentEscapeDirection, myOrganism.ox, myOrganism.oy);
			this.move(escapeCoords.x + myOrganism.ox, escapeCoords.y + myOrganism.oy);
			if (shouldSplit && !pressingButton) {
				pressingButton = true;
				setTimeout(function() {
					pressingButton = false;
				}, 80);
				this.split();
			}
			//TODO update chart
			return;
		}

		//Execute prowling behavior

		//Find closest skittle
		if (this.totalSize < 201 || myOrganisms.length > 1) {
			var closestSkittle = null;
			var closestSkittleDistance = 99999;
			for (var i=0;i<skittles.length; i++) {
				if (skittles[i] == undefined || skittles[i] == null) {
					continue;
				}
				var currentDistance = distance(myOrganism, skittles[i]);
				if (currentDistance < closestSkittleDistance) {
					closestSkittleDistance = currentDistance;
					closestSkittle = skittles[i];
				}
			}
			if (closestSkittle != null) {
				this.impulses.push(new Impulse(-1,closestSkittle.ox, closestSkittle.oy, closestSkittleDistance, false, false, 'Skittle', '#00FF00'));
				this.move(closestSkittle.ox, closestSkittle.oy);

				//TODO update chart
				return;
			}
		}
	},
	move:function(x,y){}, //overwrite these in main_out.js
	split:function(){},
	shoot:function(){},
	onDraw:function(ctx,myOrganisms){
		if (myOrganisms == undefined || myOrganisms == null || myOrganisms.length < 1) {
			return;
		}
		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];
			var myOrganism=myOrganisms[0];
			ctx.beginPath();

			if(impulse.threat > 0){
				ctx.strokeStyle='red'
			} else {
				ctx.strokeStyle='green'
			}
			ctx.moveTo(myOrganism.ox,myOrganism.oy);
			ctx.lineTo(impulse.x, impulse.y);
			ctx.stroke();
		}
	}
};
var lastLog = 101;

//Check if enemy is a threat/opportunity
function withinThreatRange(myOrganisms, organism, totalSize, dodgeDistance) {
	var threat = 0;
	var shouldSplit = false;
	var shouldShootMass = false;
	var myOrganism = myOrganisms[0];
	var color= '#FF0000';
	var label = 'Immediate';

	if (organism == undefined || organism == null) {
		return;
	}

	var impulseDistance = 999999;
	for (var i=0;i<myOrganisms.length;i++) {
		if (myOrganisms[i] == undefined || myOrganisms[i] == null) {
			continue;
		}

		//Calc if organism is a threat, and if so, then at what range should I be worried
		var threatDistance = 9999999;
		if (!organism.isVirus) {

			//Can he eat me?
			if (canBeEaten(myOrganisms[i], organism)) {

				//Can he split to eat me? Would it be worth it to him?
				if (!canBeSplitEaten(myOrganisms[i], organism) || totalSize * 6 < organism.size) {
					threatDistance = consumptionDistance(myOrganisms[i], organism);
					label = 'Consume Threat';
				} else {
					threatDistance = calcSplitDistance(myOrganisms[i], organism);
					label = 'Split Threat';
				}
			}
			if (isTravelingTowardsMe(myOrganisms[i], organism)) {
				threatDistance += distance(organism.ox, organism.oy, organism.dx, organism.dy);
			}

		//Can I eat this virus?
		} else if (canBeEaten(organism, myOrganisms[i])) {
			threatDistance = consumptionDistance(organism, myOrganisms[i]);
			label = 'Virus Threat';
		}

		if (threatDistance != 9999999) {
			impulseDistance = threatDistance;
			//Am I in danger of being eaten
			var currentThreatDistance = distance(myOrganisms[i], organism);
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
				if (currentThreatDistance < threatDistance + dodgeDistance && Math.abs(organism.dx) + Math.abs(organism.dy) > 120 && isTravelingTowardsMe(myOrganisms[i], organism)) {
					console.log('splitting to escape from ' + organism.name);
					shouldSplit = true;
				}
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
		impulseDistance = shortestDistance;
		var closestOfMyOrganisms = myOrganisms[0];
		for (var i=1;i<myOrganisms.length; i++) {
			var currentOrganism = myOrganisms[i];
			if (currentOrganism == undefined || currentOrganism == null) {
				continue;
			}
			var currentDistance = distance(organism, currentOrganism);
			if (currentDistance < shortestDistance) {
				closestOfMyOrganisms = currentOrganism;
				shortestDistance = currentDistance;
			}
		}

		//Can I eat it?
		if (canBeEaten(organism, closestOfMyOrganisms)) {

			//Can I split to eat it?
			if (organism.size * 5 > closestOfMyOrganisms.size && canBeSplitEaten(organism, closestOfMyOrganisms)) {

				//Is it within range?
				var splitDistance = calcSplitDistance(organism, closestOfMyOrganisms);
				if (attackSplitCooldown == 0 && splitDistance + dodgeDistance / 2 > shortestDistance) {
					if (attackSplitWarmup != 1) {
						attackSplitWarmup = 5;
					}
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - splitDistance) * organism.size));
					if (splitDistance > shortestDistance && myOrganisms.length < 16) {
						shouldSplit = true;
						label = 'Split to eat';
						color = '#00FF00';
					}
				}

			} else {

				//Is it within range without splitting?
				var currentConsumptionDistance = consumptionDistance(closestOfMyOrganisms, organism);
				if (shortestDistance < currentConsumptionDistance + dodgeDistance) {
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - currentConsumptionDistance) * organism.size));
					label = 'Consume Eat';
					color = '#00FF00';
				}
			}
		}
	}
	if (threat != 0) {
		return new Impulse(threat, organism.ox + organism.dx, organism.oy + organism.dy, impulseDistance, shouldShootMass, shouldSplit, label, color);
	} else {
		return null;
	}
}
function createEdgeThreat(organism, totalSize, dodgeDistance) {
	if (organism.x < dodgeDistance) {
		return new Impulse(totalSize, 0, organism.y, dodgeDistance, false, false, 'Left Threat', '#FF0000');
	} else if (organism.y < dodgeDistance) {
		return new Impulse(totalSize, organism.x, 0, dodgeDistance, false, false, 'Top Edge', '#FF0000');
	} else if (organism.x > 11200 - dodgeDistance) {
		return new Impulse(totalSize, 11200, organism.y, dodgeDistance, false, false, 'Right Edge', '#FF0000');
	} else if (organism.y > 11200 - dodgeDistance) {
		return new Impulse(totalSize, organism.x, 11200, dodgeDistance, false, false, 'Bottom Edge', '#FF0000');
	}
}
function isTravelingTowardsMe(food, eater) {
	var enemyVector = toDegrees(eater.dx, eater.dy, eater.ox, eater.oy);
	var enemyDirection = toDegrees(food.ox, food.oy, eater.ox, eater.oy);
	return Math.abs(enemyVector - enemyDirection) < 15 || Math.abs(Math.min(enemyVector, enemyDirection) + 360 - Math.max(enemyDirection, enemyVector)) < 15;
}
function sanitizeDegrees(degrees) {
	while (degrees > 359) {
		degrees -= 360;
	}
	return degrees;
}
function toDegrees(x1,y1, x2, y2) {
	var deltaX = x2 - x1;
	var deltaY = y2 - y1;
	var rad = Math.atan2(deltaY, deltaX); // In radians
	return rad * (180 / Math.PI);
}
function toCoords(degrees, x, y) {
	var coordinates = {x: x, y: y};
	coordinates.x = 400 * Math.cos(degrees * Math.PI / 180);
	coordinates.y = 400 * Math.sin(degrees * Math.PI / 180);
	return coordinates;
}
function distance(organism1, organism2) {
	return Math.sqrt(Math.pow(organism1.ox - organism2.ox, 2) + Math.pow(organism1.oy - organism2.oy, 2));
}
function calcSplitDistance(food, eater) {

	var splitDistance = eater.size * (3.5 - eater.size / 800) + 250;
	var splitSize = eater.size / 2;

	var sizePercentage = food.size / splitSize;
	var consumptionDistance = (splitSize / 2 + food.size / 2 - sizePercentage * splitSize / 2) * 2.1;
	return splitDistance - consumptionDistance;

}
function consumptionDistance(myOrganism, otherOrganism) {
	if ((otherOrganism.isVirus && !canBeEaten(otherOrganism, myOrganism))
			|| (otherOrganism.isVirus && !canBeEaten(myOrganism, otherOrganism))) {
		return -1;
	}
	var sizePercentage = myOrganism.size / otherOrganism.size;
	return (otherOrganism.size / 2 + myOrganism.size / 2 - sizePercentage * otherOrganism.size / 2) * 2.1;
}
function canBeSplitEaten(food, eater) {
	return food.size * 1.05 < eater.size / 2;
}
function canBeEaten(food, eater) {
	return food.size * 1.15 < eater.size;
}

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




//Map is 11200x11200
Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false
var canvas=$('<canvas id="score-history-chart" width="200" height="200" style="position:fixed"></canvas>')
$('body').append(canvas);
var ctx=canvas.get(0).getContext("2d")
var labels=[],
	data1=[],
	data2=[]
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}

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

var behaviorCanvas=$('<div style="position:fixed;width:100%;bottom:5px;text-align:center"><h4>Bot Behavior</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorCanvas)
var behaviorCtx=$('#behavior-canvas').get(0).getContext("2d")

var Consideration=function(label,consider,weight,color){
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.consider=consider;
}