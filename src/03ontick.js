tick: function(organisms, myOrganisms, score) {
	//Check Dead
	if (!checkDead(this, myOrganisms, score)) {
		return;
	}

	organisms = organisms.filter(function (organism) {
		return myOrganisms.indexOf(organism) == -1;
	});

	var organismState = new OrganismState(myOrganisms, organisms);

	var myOrganism = new MyOrganism(myOrganisms);
	$massStat.text('Size: ' + Math.floor(myOrganism.size) + ':' + Math.floor(myOrganism.mass) + '(' + Math.floor(this.runCooldown) + ')');
	$dodgeStat.text('Speed: ' + Math.floor(myOrganism.speed) + ' { ' + Math.floor(myOrganism.dx) + ' , ' + Math.floor(myOrganism.dy) + ' } (' + Math.floor(myOrganism.direction) + ')');


	if (this.attackSplitCooldown > 0) {
		this.attackSplitCooldown--;
	}
	if (this.runCooldown > 0) {
		this.runCooldown--;
	}

	this.organismState = organismState;
	this.myOrganism = myOrganism;
	this.safeSplit = true;
	this.threatened = false;
	this.immediateThreats = false;
	this.impulses = gatherImpulses(organismState, myOrganism, this);
	var runCooldownString = 'Safe Split: ' + (this.safeSplit ? '<span style="color: green;">True</span>' : '<span style="color: red;">False</span>');
	runCooldownString += ' Threatened: ' + (this.threatened ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	runCooldownString += ' Immediate: ' + (this.immediateThreats ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	$runCooldown.html(runCooldownString);

	//If under threat, add threats for near edges
	if (this.threatened) {
		var edgeThreat = createEdgeThreat(myOrganism);
		if (edgeThreat != undefined) {
			this.impulses.push(edgeThreat);
		}
	}

	//Sort by biggest concern
	this.impulses.sort(function (a, b) {
		if (a.threat == -1 && b.threat == -1) {
			return a.distance - b.distance;
		}

		if (a.threat < 1 && b.threat > 0) {
			return 1;
		}
		if (b.threat < 1 && a.threat > 0) {
			return -1;
		}
		//biggest negatives go first
		if (b.threat < 1 && a.threat < 1) {
			return a.threat - b.threat;
		}
		var aWorry = a.worryDistance > a.distance;
		var bWorry = b.worryDistance > b.distance;
		if (aWorry && bWorry) {
			return a.distance - b.distance;
		}
		if (aWorry) {
			return -1;
		}
		if (bWorry) {
			return 1;
		}

		return a.worryDistance - b.worryDistance;
	});

	//remove excess impulses
	var tempArray = [];
	var previousThreat = 0;
	for (var i=0; i< this.impulses.length; i++) {
		var impulse = this.impulses[i];

		if (this.immediateThreats && impulse.worryDistance < impulse.distance) {
			continue;
		}

		if (!this.immediateThreats && impulse.threat > -1 && this.runCooldown < 1) {
			continue;
		}

		if (this.threatened && impulse.threat < 0 && this.runCooldown > 0) {
			continue;
		}
		if (previousThreat < 0) {
			continue;
		}
		tempArray.push(impulse);
		if (previousThreat > -1) {
			previousThreat = impulse.threat;
		}
	}
	this.impulses = tempArray;

	printImpulseLog(this.impulses, this);

	if (this.immediateThreats) {
		this.runCooldown = 40;
	}

	//Find vector and split or shoot
	var moveDirection = 0;
	var shouldSplit = false;
	var shouldShoot = false;
	var opportunity = null;
	var moveDistance = 0;
	var averageNumber = 0;
	for (var i = 0; i < this.impulses.length; i++) {
		var impulse = this.impulses[i];

		averageNumber++;
		moveDirection += impulse.direction;
		moveDistance = impulse.distance;


		//Only go with the biggest opportunity
		if (impulse.threat < 0) {
			if (impulse.worryDistance < impulse.distance) {
				shouldSplit = true;
			}
			opportunity = impulse;
		}

		//defensive split
		if (impulse.worryDistance > impulse.distance && getAngleDifference(impulse.direction, impulse.enemy.direction) < 15 && impulse.enemy.speed > 40) {
			shouldSplit = true;
		}
	}
	if (this.impulses.length != 0) {
		moveDirection = moveDirection / averageNumber;

		if (this.impulses[0].threat > 0) {
			moveDirection += 180;
			moveDirection = sanitizeDegrees(moveDirection);
			moveDistance = 400;
		}
	}

	var moveCoords = toCoords(moveDirection, myOrganism.ox, myOrganism.oy, moveDistance);

	if (shouldSplit && !this.threatened && opportunity != null) {
		moveCoords.x += opportunity.enemy.dx * 2;
		moveCoords.y += opportunity.enemy.dy * 2;
		//make sure I'm pointed in the right direction
		if (getAngleDifference(opportunity.direction, myOrganism.direction) > 10) {
			shouldSplit = false;
		}
	}
	this.moveCoords = moveCoords;
	this.move(moveCoords.x, moveCoords.y);
	//TODO possible button cooldown
	if (shouldSplit) {
		//this.split();
		//this.attackSplitCooldown = 80;
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
},