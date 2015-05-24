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