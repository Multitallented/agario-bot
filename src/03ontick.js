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
	$massStat.text('Size: ' + Math.floor(myOrganism.size) + ':' + Math.floor(myOrganism.mass) + '(x' + Math.floor(myOrganism.ox) + ',y' + Math.floor(myOrganism.oy) + ')');
	$dodgeStat.text('Speed: (' + Math.floor(myOrganism.direction) + ')' + Math.floor(myOrganism.speed) + ' { ' + Math.floor(myOrganism.dx) + ' , ' + Math.floor(myOrganism.dy) + ' }');


	if (this.attackSplitCooldown > 0) {
		this.attackSplitCooldown--;
	}
	if (this.runCooldown > 0) {
		this.runCooldown--;
	}
	if (this.immediateThreatCooldown > 0) {
		this.immediateThreatCooldown--;
	}

	this.organismState = organismState;
	this.myOrganism = myOrganism;
	this.safeSplit = true;
	this.threatened = false;
	this.opportunity = false;
	this.immediateThreats = false;
	this.impulses = gatherImpulses(organismState, myOrganism, this);
	var runCooldownString = 'Safe Split: ' + (this.safeSplit ? '<span style="color: green;">True</span>' : '<span style="color: red;">False</span>');
	runCooldownString += ' Threatened: ' + (this.threatened ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	runCooldownString += ' Immediate: ' + (this.immediateThreats ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	runCooldownString += '<br>Enabled: ' + (window.botEnabled ? '<span style="color: green;">True</span>' : '<span style="color: blue;">False</span>');
	runCooldownString += ' Opportunity: ' + (this.opportunity ? '<span style="color: green;">True</span>' : '<span style="color: blue;">False</span>');
	$runCooldown.html(runCooldownString);

	//If under threat, add threats for near edges
	if (this.threatened) {
		var edgeThreat = createEdgeThreat(myOrganism);
		for(var i=0;i<edgeThreat.length;i++) {
			this.impulses.push(edgeThreat[i]);
		}
	}

	//Sort by biggest concern
	this.impulses.sort(function (a, b) {
		//edges take priority
		if (a.threat == 999999) {
			return -1;
		}
		if (b.threat == 999999) {
			return 1;
		}

		//go for closest skittle
		if (a.threat == -1 && b.threat == -1) {
			return a.distance - b.distance;
		}

		//threats before opportunities
		if (a.threat < 0 && b.threat > -1) {
			return 1;
		}
		if (b.threat < 0 && a.threat > -1) {
			return -1;
		}
		//biggest negatives go first
		if (b.threat < 0 && a.threat < 0) {
			return a.threat - b.threat;
		}
		var aWorry = a.worryDistance > a.distance;
		var bWorry = b.worryDistance > b.distance;
		//immediate threats first
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

	//========================
	//remove excess impulses
	var tempArray = [];
	var previousThreat = 0;
	var biggestThreat = -1;
	var smallestThreat = 999999;
	var isRunning = this.immediateThreats || (this.threatened && this.runCooldown > 0);

	for (var i=0; i< this.impulses.length; i++) {
		var impulse = this.impulses[i];
		biggestThreat = Math.max(biggestThreat, impulse.threat);
		smallestThreat = Math.min(smallestThreat, impulse.threat);
	}
	var biggestImpulse = smallestThreat;
	if (biggestImpulse < 0) {
		biggestImpulse = Math.max(biggestThreat, Math.abs(smallestThreat));
	} else if (biggestImpulse == 999999) {
		biggestImpulse = biggestThreat;
	} else {
		biggestImpulse = biggestThreat;
	}

	for (var i=0; i< this.impulses.length; i++) {
		var impulse = this.impulses[i];

		//ignore non-threats and non-opportunities
		if (impulse.threat == 0) {
			continue;
		}

		//ignore minor threats/opportunities
		if (isRunning && !this.opportunity && biggestImpulse > 1 && Math.abs(impulse.threat * 2) < biggestImpulse) {
			continue;
		}

		//ignore threats that are farther away
		if (this.immediateThreats && impulse.distance / 2 > this.impulses[0].distance) {
			continue;
		}

		//when threatened, don't show any non-immediate threats
		if (this.immediateThreats && !impulse.enemy.isVirus && impulse.worryDistance < impulse.distance && impulse.threat != 999999) {
			continue;
		}

		//if not immediately threatened and not running, then skip threats
		if (!this.immediateThreats && impulse.threat > -1 && this.runCooldown < 1) {
			continue;
		}

		//if threatened and running, skip opportunities
		if (this.threatened && (impulse.threat < 1 || impulse.label == 'Virus Threat') && this.runCooldown > 0) {
			continue;
		}

		//don't chase people you can't catch
		if (this.opportunity && impulse.threat < -1 && impulse.enemy.dx != 0 && impulse.worryDistance + 100 < impulse.distance) {
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

	//If no impulses, then go to the center of the map
	if (this.impulses.length < 1) {
		this.impulses.push(new Impulse(-1,
			{name: 'Center Map', ox: 5600, oy: 5600, dx: 0, dy: 0, mass: 1},
			myOrganism.organisms,
			distance({ox: 5600, oy: 5600}, myOrganism),
			0,
			toDegrees(myOrganism.ox, myOrganism.oy,5600, 5600),
			'Center Map',
			'#0000FF'));
	}


	if (this.immediateThreats) {
		this.runCooldown = 40;
	}

	//sort by direction
	if (this.impulses.length > 1) {
		this.impulses.sort(function(a, b) {
			return a.direction - b.direction;
		});
	}
	printImpulseLog(this.impulses, this);

	//Find vector and split or shoot
	var shouldSplit = false;
	var shouldShoot = false;
	var opportunity = null;
	var moveDistance = 0;
	var moveDirection = 0;
	var gap = -1;
	for (var i = 0; i < this.impulses.length; i++) {
		var impulse = this.impulses[i];

		if (this.impulses.length == 1) {
			if (impulse.threat > -1) {
				moveDirection = sanitizeDegrees(impulse.direction + 180);
			} else {
				moveDirection = impulse.direction;
			}
		} else {
			var currentGap = -1;
			if (i==0) {
				currentGap = (360 + impulse.direction) - this.impulses[this.impulses.length - 1].direction;
			} else {
				currentGap = impulse.direction - this.impulses[i-1].direction;
			}
			var isNewGap = (gap == -1 ||
				(isRunning && currentGap > gap) ||
				(!isRunning && currentGap < gap));
			if (isNewGap) {
				gap = currentGap;
				if (i==0) {
					moveDirection = sanitizeDegrees(this.impulses[this.impulses.length - 1].direction + currentGap / 2);
				} else {
					moveDirection = sanitizeDegrees(this.impulses[i-1].direction + currentGap / 2);
				}
			}
		}

		moveDistance = myOrganism.organisms.length > 1 ? impulse.distance + 20 : impulse.distance;

		//Only go with the biggest opportunity
		if (impulse.threat < -1) {

			if (runOnce && impulse.target.length > 0 && canBeSplitEaten(impulse.enemy, impulse.target[0])) {
				console.log('split opp: ' + isTravelingTowardsMe(impulse.direction, myOrganism.direction) + ":" + impulse.worryDistance > impulse.distance);
				runOnce = false;
			}

			if (impulse.target.length > 0 && canBeSplitEaten(impulse.enemy, impulse.target[0]) && impulse.worryDistance > impulse.distance && isTravelingTowardsMe(impulse.direction, myOrganism.direction)) {
				shouldSplit = true;
			}
			opportunity = impulse;
		}

		//defensive split
		if (impulse.enemy.speed > 30 && 300 + myOrganism.size > impulse.distance) {
			console.log('defensive split: ' + getAngleDifference(sanitizeDegrees(impulse.direction + 180), impulse.enemy.direction));
		}
		if ((impulse.threat > 0 || canBeEaten(myOrganism, impulse.enemy)) &&
			300 + myOrganism.size > impulse.distance &&
			isTravelingTowardsMe(impulse.direction, impulse.enemy) &&
			impulse.enemy.speed > 30) {
			shouldSplit = true;
		}
	}

	//TODO adjust for multiple opportunities


	if (this.impulses.length != 0 && this.impulses[0].threat > 0) {
		moveDistance = 400;
	}

	var moveCoords = toCoords(moveDirection, myOrganism.ox, myOrganism.oy, moveDistance);

	if (shouldSplit && opportunity != null && this.safeSplit) {
		moveCoords.x += opportunity.enemy.dx * 2;
		moveCoords.y += opportunity.enemy.dy * 2;
	}
	this.moveCoords = moveCoords;
	if (window.botEnabled) {
		this.move(moveCoords.x, moveCoords.y);
		//TODO possible button cooldown
		if (shouldSplit && this.attackSplitCooldown < 1) {
			this.split();
			this.attackSplitCooldown = 40;
		}
	}
},