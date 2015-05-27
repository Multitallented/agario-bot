onTick: function(organisms, myOrganisms, score) {
	//Check Dead
	if (!checkDead(this, myOrganisms)) {
		return;
	}

	var myOrganism = new MyOrganism(myOrganisms);
	$massStat.text('Size: ' + myOrganism.size);
	$dodgeStat.text('Speed: ' + myOrganism.speed + '(' + myOrganism.direction + ')');

	checkCooldowns(this);

	var organismState = new OrganismState(myOrganisms, organisms);
	this.safeSplit = true;
	this.threatened = false;
	this.impulses = gatherImpulses(organismState, myOrganism, this);
	$runCooldown.text('Safe Split: ' + (this.safeSplit ? '<span style="color: green;">True</span>' : '<span style="color: red;">False</span>'));
	printImpulseLog(this.impulses);

	//If under threat, add threats for near edges
	if (this.threatened) {
		var edgeThreat = createEdgeThreat(myOrganism);
		if (edgeThreat != undefined) {
			this.impulses.push(edgeThreat);
		}
	}

	//Sort by biggest threat
	this.impulses.sort(function(a,b){
		return b.threat - a.threat;
	});

	//remove all unimportant impulses
	var closestThreat = 999999;
	for (var i=0; i<this.impulses.length; i++) {
		var impulse = this.impulses[i];

		//Ignore non-threats if threatened
		if (this.threatened && impulse.threat < 1) {
			this.impulses.splice(i, 1);
			continue;
		}

		closestThreat = Math.min(closestThreat, impulse.distance);
	}

	//Find vector and split or shoot
	for (var i=0; i<this.impulses.length; i++) {
		var impulse = this.impulses[i];

	}

	// super large = 300(0)
	// split threat = 500(180)!
	// move 400(0)

	// super large = 10(0)!
	// super large = 10(180)!
	// move 400(90)

	// split threat = 400(0)
	// split threat = 300(180)!
	// move 400(0)

	// super large = 400(0)
	// super large = 400(180)
	// move 400(90)

	// super large = 10(0)!
	// left edge = 500(180)!
	// move 400(170)

	// super large = 10(0)!
	// left edge = 10(180)!
	// move 400(90)


	/*this.threatEscapeVectors = [];
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
	}*/
},