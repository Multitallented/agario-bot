var Bot=function(move,split,shoot){
	this.move=move;
	this.split=split;
	this.shoot=shoot;
	this.behaviorChart=new Chart(behaviorCtx).Doughnut(this.possibleImpulses);
};
var runOnce = true;
var pressingButton = window.pressingButton = false;
var attackSplitCooldown = 0;
var attackSplitWarmup = -1;
var threatCooldown = 0;
var threatLog = 0;
var preEatLog = 0;
var eatLog = 0;
var lastEscapeVector = 0;
var lastImpulse = "";
var closestEnemy = 999999;
var closestEnemySize = 10;
var lastSize = 10;
Bot.prototype = {
	impulses: [],
	largestSelf: 10,
	totalSize: 10,
	lastStateChangeDate:null,
	runOnce: true,
	gameHistory:[],
	scoreHistory:[],
	dodgeDistance: 200,
	maxThreatCooldown: 40,
	possibleImpulses:[
		{
			value: 1,
			label: 'Running',
			color: '#0000FF'
		},
		{
			value: 1,
			label: 'Skittle',
			color: '#00FF00'
		},
		{
			value: 1,
			label: 'Immediate',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Consume Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Split Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Virus Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Left Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Top Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Right Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Bottom Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Split Eat',
			color: '#00FF00'
		},
		{
			value: 1,
			label: 'Consume Eat',
			color: '#00FF00'
		}
	],
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
				console.log("Closest Enemy " + closestEnemy + "(" + closestEnemySize + ")" + lastSize + "(" + this.dodgeDistance + ")");
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
		this.scoreHistory.push(score);

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
		var myOrganism=getGeneralOrganism(myOrganisms, this.totalSize),
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
		if (threatCooldown > 0) {
			threatCooldown--;
		}
		if (preEatLog > 0) {
			preEatLog--;
		}
		if (eatLog > 0) {
			eatLog--;
		}
		if (threatLog > 0) {
			threatLog--;
		}

		//Find largest size
		this.largestSelf = 10;
		this.totalSize = 0;
		for (var i=0;i<myOrganisms.length; i++) {
			this.totalSize += myOrganisms[i].size;
			this.largestSelf = Math.max(this.largestSelf, myOrganisms[i].size);
		}
		lastSize = myOrganisms[0].size;
		this.dodgeDistance = 30 * 100 / this.largestSelf;
		this.maxThreatCooldown = Math.floor(Math.max(Math.min(25 * this.largestSelf / 100, 20), 50));

		//Can I split safely to eat someone?
		var safeSplit = true;
		closestEnemy = 999999;
		for (var i=0;i<otherOrganisms.length; i++) {
			if (this.totalSize * 6 < otherOrganisms[i].size) {
				continue;
			}
			var currDistance = distance(otherOrganisms[i], myOrganism);
			if (currDistance < closestEnemy) {
				closestEnemy = currDistance;
				closestEnemySize = otherOrganisms[i].size;
			}
			var incomingSplitDistance = calcSplitDistance({size: this.totalSize / myOrganisms.length}, {size: otherOrganisms[i].size * 2});
			if (incomingSplitDistance > currDistance + this.dodgeDistance) {
				safeSplit = false;
				break;
			}
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
		var threatCount = 0;
		var currentEscapeDirection = 0;
		var shouldSplit = false;

		//Sort by biggest threat
		this.impulses.sort(function(a,b){
			return b.threat - a.threat;
		});

		//Run from last threat for 4 seconds
		if (this.impulses.length < 1 && threatCooldown > 0) {
			var escapeCoords = toCoords(sanitizeDegrees(lastEscapeVector + 180), myOrganism.ox, myOrganism.oy, 400);
			this.impulses.push(new Impulse(1,escapeCoords.x, escapeCoords.y, 400, false, false, 'Running', '#0000FF'));
		}

		//If under threat, add threats for near edges
		if (this.impulses.length > 0 && this.impulses[0].threat > 0) {
			var edgeThreat = createEdgeThreat(myOrganism, this.totalSize, this.dodgeDistance);
			if (edgeThreat != undefined) {
				this.impulses.push(edgeThreat);
			}
		}

		var hasOpportunity = false;
		for (var i=0; i<this.impulses.length; i++) {
			if (this.impulses[i].threat < 0) {
				hasOpportunity = true;
				break;
			}
		}

		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];
			//Follow through with an attack split
			if (impulse.threat > 0 && !(attackSplitCooldown > 0 && hasOpportunity)) {
				threatCount++;
				if (impulse.split) {
					shouldSplit = true;
				}
				currentEscapeDirection += toDegrees(myOrganism.ox, myOrganism.oy, impulse.x, impulse.y) * impulse.threat;

			//ignore opportunities if threatened
			} else if (threatCount == 0 && impulse.threat < 0) {
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
				if (impulse != null && lastImpulse != impulse.label) {
					lastImpulse = impulse.label;
					updateBehaviorChart([impulse], this.behaviorChart);
				}
				return;
			}

			//Weight subsequent actions based on threat
			absoluteTotalThreat += Math.abs(impulse.threat);
		}


		//Execute escape manuevers if threatened
		if (threatCount > 0) {
			if (threatLog == 19) {
				console.log("Escape Vector Calc: " + currentEscapeDirection + ", " + absoluteTotalThreat +
					" = " + sanitizeDegrees(currentEscapeDirection / absoluteTotalThreat + 180));
			}
			currentEscapeDirection = sanitizeDegrees(currentEscapeDirection / absoluteTotalThreat + 180);

			if (absoluteTotalThreat > 1) {
				lastEscapeVector = currentEscapeDirection;
				threatCooldown = this.maxThreatCooldown;
			}

			var escapeCoords = toCoords(currentEscapeDirection, myOrganism.ox, myOrganism.oy, 400);
			this.move(escapeCoords.x, escapeCoords.y);
			if (shouldSplit && !pressingButton) {
				pressingButton = true;
				setTimeout(function() {
					pressingButton = false;
				}, 80);
				this.split();
			}

			var impulseString = "";
			for (var i=0; i< this.impulses.length; i++) {
				if (impulseString == "") {
					impulseString += this.impulses[i].label;
				} else {
					impulseString += " : " + this.impulses[i].label;
				}
			}
			if (impulseString != "" && lastImpulse != impulseString) {
				lastImpulse = impulseString;
				updateBehaviorChart(this.impulses, this.behaviorChart);
			}
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
				var impulse = new Impulse(-1,closestSkittle.ox, closestSkittle.oy, closestSkittleDistance, false, false, 'Skittle', '#00FF00');
				this.impulses.push(impulse);
				this.move(closestSkittle.ox, closestSkittle.oy);

				if (impulse != null && lastImpulse != impulse.label) {
					lastImpulse = impulse.label;
					updateBehaviorChart([impulse], this.behaviorChart);
				}
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
		var totalSize = 0;
		for (var i=0; i< myOrganisms.length; i++) {
			totalSize += myOrganisms[i].size;
		}
		var myOrganism=getGeneralOrganism(myOrganisms, totalSize);
		var threatCount = 0;
		var absoluteTotalThreat = 0;
		var currentEscapeDirection = 0;
		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];
			ctx.beginPath();

			if(impulse.threat > 0){
				threatCount++;
				absoluteTotalThreat += Math.abs(impulse.threat);
				currentEscapeDirection += toDegrees(myOrganism.ox, myOrganism.oy, impulse.x, impulse.y) * impulse.threat;
				ctx.strokeStyle='red';
			} else {
				ctx.strokeStyle='green';
			}
			ctx.moveTo(myOrganism.ox,myOrganism.oy);
			ctx.lineTo(impulse.x, impulse.y);
			ctx.stroke();
		}
		if (threatCount > 0) {
			currentEscapeDirection = sanitizeDegrees(currentEscapeDirection / absoluteTotalThreat + 180);
			var escapeCoords = toCoords(currentEscapeDirection, myOrganism.ox, myOrganism.oy, 400);
			ctx.beginPath();
			ctx.strokeStyle='blue';
			ctx.moveTo(myOrganism.ox,myOrganism.oy);
			ctx.lineTo(escapeCoords.x, escapeCoords.y);
			ctx.stroke();
		}
	}
};
var lastLog = 101;

//Check if enemy is a threat/opportunity
function withinThreatRange(myOrganisms, organism, totalSize, dodgeDistance, safeSplit) {
	var threat = 0;
	var shouldSplit = false;
	var shouldShootMass = false;
	var myOrganism = getGeneralOrganism(myOrganisms, totalSize);
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
		var highPriority = 1;
		var currDistance = distance(myOrganisms[i], organism);
		if (!organism.isVirus) {

			//Can he eat me?
			if (canBeEaten(myOrganisms[i], organism)) {

				//Can he split to eat me? Would it be worth it to him?
				if (!canBeSplitEaten(myOrganisms[i], organism) || totalSize * 6 < organism.size) {
					threatDistance = consumptionDistance(myOrganisms[i], organism);
					label = 'Consume Threat ' + organism.name;
					highPriority += (threatDistance - currDistance) / threatDistance;
				} else {
					threatDistance = calcSplitDistance(myOrganisms[i], organism);
					highPriority += 0.5 * (threatDistance - currDistance) / threatDistance;
					label = 'Split Threat ' + organism.name;
				}
			}
			if (isTravelingTowardsMe(myOrganisms[i], organism)) {
				threatDistance += distance(organism.ox, organism.oy, organism.dx, organism.dy) * 2;
				highPriority += 0.25;
			}
			if (isTravelingTowardsMe(organism, myOrganisms[i])) {
				threatDistance += distance(myOrganisms[i].ox, myOrganisms[i].oy, myOrganisms[i].dx, myOrganisms[i].dy) * 2;
				highPriority += 0.25;
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
					threat += myOrganisms[i].size * 0.6 * highPriority;
				} else if (threat == 0) {
					threat -= organism.size;
				}
			} else if (currentThreatDistance < threatDistance + dodgeDistance) {
				threat += myOrganisms[i].size * highPriority;
				if (threatLog < 1) {
					console.log(label + " " + threat + ":" + highPriority + ":" + (Math.abs(organism.dx) + Math.abs(organism.dy))
					);
					threatLog = 20;
				}

				//Should I split to avoid this?
				if (currentThreatDistance < threatDistance + dodgeDistance && Math.abs(organism.dx) + Math.abs(organism.dy) > 50 && isTravelingTowardsMe(myOrganisms[i], organism)) {
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
			if (safeSplit && organism.size * 5 > closestOfMyOrganisms.size && canBeSplitEaten(organism, closestOfMyOrganisms)) {

				//Is it within range?
				var splitDistance = calcSplitDistance(organism, closestOfMyOrganisms);
				if (preEatLog < 1) {
					console.log("Pre-Eat Split " + attackSplitCooldown + (splitDistance + dodgeDistance / 2 > shortestDistance));
					preEatLog = 20;
				}
				if (attackSplitCooldown == 0 && splitDistance + dodgeDistance / 2 > shortestDistance) {
					if (eatLog < 1) {
						console.log("Eat Split " + attackSplitWarmup + ":" + (splitDistance > shortestDistance) + ":" + myOrganisms.length);
						eatLog = 20;
					}
					if (attackSplitWarmup == -1) {
						attackSplitWarmup = 3;
					}
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - splitDistance) * organism.size));
					if (attackSplitWarmup < 2 && splitDistance > shortestDistance && myOrganisms.length < 16) {
						shouldSplit = true;
						label = 'Split Eat ' + organism.name;
						color = '#00FF00';
					}
				} else {
					attackSplitWarmup = -1;
				}

			} else {

				//Is it within range without splitting?
				var currentConsumptionDistance = consumptionDistance(closestOfMyOrganisms, organism);
				if (shortestDistance < currentConsumptionDistance + dodgeDistance) {
					threat -= organism.size + Math.min(0, Math.max(organism.size, (shortestDistance - currentConsumptionDistance) * organism.size));
					label = 'Consume Eat ' + organism.name;
					color = '#00FF00';
				}
			}
		}
	}
	var threatX = organism.ox;
	var threatY = organism.oy;
	//if (isTravelingTowardsMe(myOrganism, organism)) {
	//	threatX += organism.dx;
	//	threatY += organism.dy;
	//}

	if (threat != 0) {
		return new Impulse(threat, threatX, threatY, impulseDistance, shouldShootMass, shouldSplit, label, color);
	} else {
		return null;
	}
}

function getGeneralOrganism(myOrganisms, totalSize) {
	var myOrganism = {ox: 0, oy: 0, size: totalSize};
	for (var i=0; i< myOrganisms.length; i++) {
		myOrganism.ox += myOrganisms[i].ox;
		myOrganism.oy += myOrganisms[i].oy;
	}
	myOrganism.ox = myOrganism.ox / myOrganisms.length;
	myOrganism.oy = myOrganism.oy / myOrganisms.length;
	return myOrganism;
}
function createEdgeThreat(organism, totalSize, dodgeDistance) {
	if (organism.ox < dodgeDistance + totalSize) {
		return new Impulse(totalSize, 0, organism.oy, dodgeDistance + totalSize, false, false, 'Left Edge', '#FF0000');
	} else if (organism.oy < dodgeDistance + totalSize) {
		return new Impulse(totalSize, organism.ox, 0, dodgeDistance + totalSize, false, false, 'Top Edge', '#FF0000');
	} else if (organism.ox > 11200 - dodgeDistance - totalSize) {
		return new Impulse(totalSize, 11200, organism.oy, dodgeDistance + totalSize, false, false, 'Right Edge', '#FF0000');
	} else if (organism.oy > 11200 - dodgeDistance - totalSize) {
		return new Impulse(totalSize, organism.ox, 11200, dodgeDistance + totalSize, false, false, 'Bottom Edge', '#FF0000');
	}
}
function isTravelingTowardsMe(food, eater) {
	var tolerance = 30;
	var enemyVector = toDegrees(eater.dx, eater.dy, eater.ox, eater.oy);
	var enemyDirection = toDegrees(food.ox, food.oy, eater.ox, eater.oy);
	if (threatLog == 20) {
		console.log("vector compare: " + enemyVector + ", " + enemyDirection + " = " +
			(Math.abs(enemyVector - enemyDirection) < tolerance || Math.abs(Math.min(enemyVector, enemyDirection) + 360 - Math.max(enemyDirection, enemyVector)) < tolerance));
		threatLog--;
	}
	return Math.abs(enemyVector - enemyDirection) < tolerance || Math.abs(Math.min(enemyVector, enemyDirection) + 360 - Math.max(enemyDirection, enemyVector)) < tolerance;
}
function sanitizeDegrees(degrees) {
	while (degrees > 359) {
		degrees -= 360;
	}
	while (degrees < 0) {
		degrees += 360;
	}
	return degrees;
}
function toDegrees(x1,y1, x2, y2) {
	var deltaX = x2 - x1;
	var deltaY = y2 - y1;
	var rad = Math.atan2(deltaY, deltaX); // In radians
	return sanitizeDegrees(rad * (180 / Math.PI));
}
function toCoords(degrees, x, y, multiplier) {
	var coordinates = {x: x, y: y};
	coordinates.x += multiplier * Math.cos(degrees * Math.PI / 180);
	coordinates.y += multiplier * Math.sin(degrees * Math.PI / 180);
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
	return (otherOrganism.size / 2 + myOrganism.size / 2 - sizePercentage * otherOrganism.size / 1.5) * 2.3;
}
function canBeSplitEaten(food, eater) {
	return food.size < eater.size / 2;
}
function canBeEaten(food, eater) {
	return food.size * 1.15 < eater.size;
}
function updateBehaviorChart(impulses, theBehaviorChart) {
	for (var j=0; j<theBehaviorChart.segments.length; j++) {
		theBehaviorChart.segments[j].value = 0;
	}
	for(var i=0; i<impulses.length; i++) {
		if (impulses[i] == null) {
			continue;
		}
		if (i==0) {
			document.getElementById('behavior-char-title').textContent = impulses[i].label;
		}
		for (var j=0; j<theBehaviorChart.segments.length; j++) {
			if (impulses[i].label.indexOf(theBehaviorChart.segments[j].label) == -1) {
				continue;
			}
			theBehaviorChart.segments[j].value = Math.abs(impulses[i].threat);
		}
	}
	theBehaviorChart.update();
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

var behaviorCanvas=$('<div style="position:fixed;width:100%;bottom:5px;text-align:center"><h4 id="behavior-char-title">Bot Behavior</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorCanvas)
var behaviorCtx=$('#behavior-canvas').get(0).getContext("2d")

var Consideration=function(label,consider,weight,color){
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.consider=consider;
}