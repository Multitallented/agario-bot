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
var lastEscapeVector = 0;
var lastImpulse = "";
var closestEnemy = 999999;
var closestEnemySize = 10;
var closestEnemyName = "";
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
	otherOrganisms: [],
	threatEscapeVectors: [],
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
				console.log("Closest Enemy " + closestEnemyName + Math.floor(closestEnemy) + "(" + Math.floor(closestEnemySize) + ")" + Math.floor(lastSize) + "(" + Math.floor(this.dodgeDistance) + ")");
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
		var myOrganism=getGeneralOrganism(myOrganisms, this.totalSize);
		var otherOrganisms=organisms.filter(function(organism){
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
		var skittles = otherOrganisms.filter(function(organism) {
			return organism.name == "" && !organism.isVirus && organism.size < 15;
		});
		otherOrganisms = otherOrganisms.filter(function(organism) {
			return organism.size > 14;
		});
		this.otherOrganisms = otherOrganisms;
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

		//Find largest size
		this.largestSelf = 10;
		this.totalSize = 0;
		for (var i=0;i<myOrganisms.length; i++) {
			this.totalSize += myOrganisms[i].size;
			this.largestSelf = Math.max(this.largestSelf, myOrganisms[i].size);
		}
		lastSize = myOrganisms[0].size;
		largestMass = getMass(this.largestSelf);
		totalMass = getMass(this.totalSize);
		var massString = 'Total Mass: ' + Math.floor(totalMass) + "(" + Math.floor(myOrganism.size) + ")";
		massString += " " + (organisms.length - skittles.length - myOrganisms.length);
		$massStat.text(massString);
		if (totalMass > 200) {
			this.dodgeDistance = getRadius(this.totalSize);
		} else if (totalMass > 100) {
			this.dodgeDistance = getRadius(this.totalSize) * 2;
		} else {
			this.dodgeDistance = getRadius(this.totalSize) * 3;
		}
		$dodgeStat.text('Dodge Distance: ' + Math.floor(this.dodgeDistance));
		this.maxThreatCooldown = Math.floor(Math.min(Math.max(25 * largestMass / 100, 20), 60));
		$runCooldown.text('Run Cooldown: ' + this.maxThreatCooldown);

		//Can I split safely to eat someone?
		var safeSplit = true;
		closestEnemy = 999999;
		var miscStatString = "";
		for (var i=0;i<otherOrganisms.length; i++) {
			var enemyMass = getMass(otherOrganisms[i].size);
			if (totalMass * 6 < enemyMass) {
				miscStatString += otherOrganisms[i].name + "(<span style='color: green;'>" + Math.floor(enemyMass) + "</span>) ";
				var consumeDistance = consumptionDistance(myOrganism, otherOrganisms[i]);
				if (currDistance < consumeDistance && canBeEaten(myOrganism, otherOrganisms[i])) {
					miscStatString += " : <span style='color: red;'>" + Math.floor(consumeDistance) + "</span>";
				} else {
					miscStatString += " : " + Math.floor(consumeDistance);
				}
				miscStatString += "<br>";
				continue;
			}
			var currentName = otherOrganisms[i].name;
			if (currentName == '') {
				currentName = "an unnamed cell";
			}
			if (canBeEaten(myOrganism, otherOrganisms[i])) {
				miscStatString += "<span style='color: red;'>" + currentName + "</span>(" + Math.floor(enemyMass) + ") ";
			} else {
				miscStatString += currentName + "(" + Math.floor(enemyMass) + ") ";
			}
			var currDistance = distance(otherOrganisms[i], myOrganism);
			miscStatString += Math.floor(currDistance);
			if (currDistance < closestEnemy) {
				closestEnemy = currDistance;
				closestEnemySize = enemyMass;
			}
			var consumeDistance = consumptionDistance(myOrganism, otherOrganisms[i]);
			if (currDistance < consumeDistance && canBeEaten(myOrganism, otherOrganisms[i])) {
				miscStatString += " : <span style='color: red;'>" + Math.floor(consumeDistance) + "</span>";
			} else {
				miscStatString += " : " + Math.floor(consumeDistance);
			}
			var incomingSplitDistance = calcSplitDistance(myOrganism, otherOrganisms[i]);
			if (currDistance < incomingSplitDistance && canBeSplitEaten(myOrganism, otherOrganisms[i])) {
				miscStatString += " : <span style='color: red;'>" + Math.floor(incomingSplitDistance) + "</span>";
			} else {
				miscStatString += " : " + Math.floor(incomingSplitDistance);
			}
			if (incomingSplitDistance > currDistance + this.dodgeDistance) {
				safeSplit = false;
			}
			miscStatString += "<br>";
		}
		$miscStat.html(miscStatString);

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

		this.threatEscapeVectors = [];
		for (var i=0; i<this.impulses.length; i++) {
			var impulse = this.impulses[i];
			//Follow through with an attack split
			if (impulse.threat > 0 && !(attackSplitCooldown > 0 && hasOpportunity)) {
				threatCount++;
				if (impulse.split) {
					shouldSplit = true;
				}
				var incomingThreatDirection = toDegrees(myOrganism.ox, myOrganism.oy, impulse.x, impulse.y);
				this.threatEscapeVectors.push(sanitizeDegrees(incomingThreatDirection + 180));
				currentEscapeDirection += incomingThreatDirection * impulse.threat;

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
			currentEscapeDirection = sanitizeDegrees(currentEscapeDirection / absoluteTotalThreat + 180);

			if (absoluteTotalThreat > 1 && this.impulses[0].label != 'Virus Threat') {
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

		//Draw dodgeDistance
		// var dodgeCoords = toCoords(15, myOrganism.ox, myOrganism.oy, getRadius(myOrganism.size) + this.dodgeDistance);
		// ctx.beginPath();
		// ctx.strokeStyle = 'black';
		// ctx.moveTo(myOrganism.ox,myOrganism.oy);
		// ctx.lineTo(dodgeCoords.x, dodgeCoords.y);
		// ctx.stroke();

		for (var i=0; i<this.threatEscapeVectors.length; i++) {
			var consumptionCoords = toCoords(this.threatEscapeVectors[i], myOrganism.ox, myOrganism.oy, 200);
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(myOrganism.ox,myOrganism.oy);
			ctx.lineTo(consumptionCoords.x, consumptionCoords.y);
			ctx.stroke();
		}

		if (this.otherOrganisms != undefined) {
			for (var i=0; i<this.otherOrganisms.length; i++) {
				var currentOrganism = this.otherOrganisms[i];
				if (currentOrganism == undefined || currentOrganism.isVirus) {
					continue;
				}
				//Draw consumption distance
				if (canBeSplitEaten(myOrganism, currentOrganism) && getMass(myOrganism.size) * 6 > getMass(currentOrganism.size)) {
					var consumptionCoords = toCoords(toDegrees(myOrganism.ox, myOrganism.oy, currentOrganism.ox, currentOrganism.oy), 
													 myOrganism.ox, 
													 myOrganism.oy, 
													 calcSplitDistance(myOrganism, currentOrganism) + this.dodgeDistance - getRadius(myOrganism.size) - getRadius(currentOrganism.size));
					ctx.beginPath();
					ctx.strokeStyle = 'cyan';
					ctx.moveTo(myOrganism.ox,myOrganism.oy);
					ctx.lineTo(consumptionCoords.x, consumptionCoords.y);
					ctx.stroke();
				} else if (canBeEaten(myOrganism, currentOrganism)) {
					var splitCoords = toCoords(toDegrees(myOrganism.ox, myOrganism.oy, currentOrganism.ox, currentOrganism.oy), 
										       myOrganism.ox, 
										       myOrganism.oy, 
										       consumptionDistance(myOrganism, currentOrganism) + this.dodgeDistance - getRadius(myOrganism.size) - getRadius(currentOrganism.size));
					ctx.beginPath();
					ctx.strokeStyle = 'black';
					ctx.moveTo(myOrganism.ox,myOrganism.oy);
					ctx.lineTo(splitCoords.x, splitCoords.y);
					ctx.stroke();
				}
			}
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
				if (!canBeSplitEaten(myOrganisms[i], organism) || getMass(totalSize) * 6 < getMass(organism.size)) {
					threatDistance = consumptionDistance(myOrganisms[i], organism) + dodgeDistance;
					label = 'Consume Threat ' + organism.name;
					highPriority += Math.max((400 + getRadius(myOrganisms[i].size) + getRadius(organism.size) - currDistance) / threatDistance, 0);
				} else {
					threatDistance = calcSplitDistance(myOrganisms[i], organism);
					highPriority += Math.max((400 + getRadius(myOrganisms[i].size) + getRadius(organism.size) - currDistance) / threatDistance, 0);
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
			threatDistance = consumptionDistance(organism, myOrganisms[i]) - dodgeDistance * 0.25;
			label = 'Virus Threat';
		}

		if (threatDistance != 9999999) {
			impulseDistance = threatDistance;
			//Am I in danger of being eaten
			var currentThreatDistance = distance(myOrganisms[i], organism);
			if (organism.isVirus && currentThreatDistance < threatDistance + dodgeDistance / 4) {

				//Can I safely eat this virus?
				if (myOrganisms.length < 16) {
					threat += getMass(myOrganisms[i].size) * 0.6 * highPriority;
				} else if (threat == 0) {
					threat -= getMass(organism.size);
				}
			} else if (currentThreatDistance < threatDistance + dodgeDistance) {
				threat += getMass(myOrganisms[i].size) * highPriority;

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
			if (safeSplit && getMass(organism.size) * 5 > getMass(closestOfMyOrganisms.size) && canBeSplitEaten(organism, closestOfMyOrganisms)) {

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
				if (shortestDistance < currentConsumptionDistance + dodgeDistance / 3) {
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
function getMass(size) {
	return Math.pow(size, 2) / 100;
}
function getDiameter(size) {
	return size * 2;
}
function getRadius(size) {
	return size;
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
	var diameter = getDiameter(totalSize);
	if (organism.ox < dodgeDistance + diameter) {
		return new Impulse(getMass(totalSize) / 2, 0, organism.oy, dodgeDistance + diameter, false, false, 'Left Edge', '#FF0000');
	} else if (organism.oy < dodgeDistance + diameter) {
		return new Impulse(getMass(totalSize) / 2, organism.ox, 0, dodgeDistance + diameter, false, false, 'Top Edge', '#FF0000');
	} else if (organism.ox > 11200 - dodgeDistance - diameter) {
		return new Impulse(getMass(totalSize) / 2, 11200, organism.oy, dodgeDistance + diameter, false, false, 'Right Edge', '#FF0000');
	} else if (organism.oy > 11200 - dodgeDistance - diameter) {
		return new Impulse(getMass(totalSize) / 2, organism.ox, 11200, dodgeDistance + diameter, false, false, 'Bottom Edge', '#FF0000');
	}
}
function isTravelingTowardsMe(food, eater) {
	var tolerance = 30;
	var enemyVector = toDegrees(eater.dx, eater.dy, eater.ox, eater.oy);
	var enemyDirection = toDegrees(food.ox, food.oy, eater.ox, eater.oy);
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
	var eaterDiameter = getDiameter(eater.size);
	var splitDistance = eaterDiameter * (3.5 - eaterDiameter / 800) + 250;
	var splitSize = eaterDiameter / 2;

	var foodDiameter = getDiameter(food.size);
	var sizePercentage = foodDiameter / splitSize;
	var consumptionDistance = (splitSize / 2 + foodDiameter / 2 - sizePercentage * splitSize / 2) * 2.1;
	return splitDistance - consumptionDistance;

}
function consumptionDistance(food, eater) {
	if ((eater.isVirus && !canBeEaten(eater, food))
			|| (eater.isVirus && !canBeEaten(food, eater))) {
		return -1;
	}
	return getRadius(eater.size);
}
function canBeSplitEaten(food, eater) {
	var foodMass = getMass(food.size);
	var eaterMass = getMass(eater.size);
	return foodMass * 1.15 < eaterMass / 2;
}
function canBeEaten(food, eater) {
	var foodMass = getMass(food.size);
	var eaterMass = getMass(eater.size);
	return eaterMass - foodMass > 10 && foodMass * 1.15 < eaterMass;
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
var $statContainer = $('<div id="stat-container"></div>');
$('body').append($statContainer);
$statContainer.css('position','fixed');
$statContainer.css('top', '220px');

var $massStat = $('<h4 id="mass-stat"></h4>');
$statContainer.append($massStat);

var $dodgeStat = $('<h4 id="dodge-stat"></h4>');
$statContainer.append($dodgeStat);

var $runCooldown = $('<h4 id="run-cooldown-stat"></h4>');
$statContainer.append($runCooldown);

var $miscStat = $('<p id="misc-stat"></p>');
$statContainer.append($miscStat);
$miscStat.css('float', 'left');

var behaviorCanvas=$('<div style="position:fixed;width:100%;bottom:5px;text-align:center"><h4 id="behavior-char-title">Bot Behavior</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$('body').append(behaviorCanvas)
var behaviorCtx=$('#behavior-canvas').get(0).getContext("2d")

var Consideration=function(label,consider,weight,color){
	this.weight=weight;
	this.label=label;
	this.color=color;
	this.consider=consider;
}