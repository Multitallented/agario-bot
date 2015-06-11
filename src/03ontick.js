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
	if (runOnce) {
		console.log(organismState);
		console.log(myOrganism);
		runOnce = false;
	}

	$massStat.text('Size: ' + Math.floor(myOrganism.size) + ':' + Math.floor(myOrganism.mass) + '(x' + Math.floor(myOrganism.ox) + ',y' + Math.floor(myOrganism.oy) + ')');
	$dodgeStat.text('Speed: (' + Math.floor(myOrganism.direction) + ')' + Math.floor(myOrganism.speed) + ' { ' + Math.floor(myOrganism.dx) + ' , ' + Math.floor(myOrganism.dy) + ' }');


	if (this.attackSplitCooldown > 0) {
		this.attackSplitCooldown--;
	} else {
		this.attackTarget = null;
	}
	if (this.defenseSplitCooldown > 0) {
		this.defenseSplitCooldown--;
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

	//defensive mode
	if (myOrganism.organisms.length > 2) {
		this.runCooldown = 2;
	}

	var runCooldownString = 'Safe Split: ' + (this.safeSplit ? '<span style="color: green;">True</span>' : '<span style="color: red;">False</span>');
	runCooldownString += ' Threatened: ' + (this.threatened ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	runCooldownString += ' Immediate: ' + (this.immediateThreats ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
	runCooldownString += '<br>Enabled: ' + (window.botEnabled ? '<span style="color: green;">True</span>' : '<span style="color: blue;">False</span>');
	runCooldownString += ' Opportunity: ' + (this.opportunity ? '<span style="color: green;">True</span>' : '<span style="color: blue;">False</span>');
	runCooldownString += ' Aggressive: ' + (aggressive ? '<span style="color: red;">True</span>' : '<span style="color: green;">False</span>');
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
	var closestThreat = 999999;
	var closestOpportunity = 999999;
	var biggestThreat = -1;
	var smallestThreat = 999999;
	var closestVirus = null;
	var closestVirusDistance = 999999;
	var isRunning = this.immediateThreats || (this.threatened && this.runCooldown > 0);

	for (var i=0; i< this.impulses.length; i++) {
		var impulse = this.impulses[i];
		var mySize = myOrganism.size;
		if (impulse.target.length > 0) {
			mySize = impulse.target[0].size;
		}
		if (impulse.threat > 0) {
			closestThreat = Math.min(impulse.distance - mySize - impulse.enemy.size, closestThreat);
		} else if (impulse.threat < -1) {
			closestOpportunity = Math.min(closestOpportunity, impulse.distance - mySize - impulse.enemy.size)
		}

		if (impulse.enemy.isVirus && impulse.distance < closestVirusDistance) {
			closestVirusDistance = impulse.distance;
			closestVirus = impulse;
		}

		if (impulse.threat == 999999) {
			continue;
		}
		biggestThreat = Math.max(biggestThreat, impulse.threat);
		smallestThreat = Math.min(smallestThreat, impulse.threat);
	}
	var biggestImpulse = smallestThreat;
	if (biggestImpulse < 0) {
		biggestImpulse = Math.max(biggestThreat, Math.abs(smallestThreat));
	} else {
		biggestImpulse = biggestThreat;
	}

	//Shoot mass behavior
	if (smartShoot && this.smartShootCount < 1) {
		smartShoot = false;
		if (closestVirus != null && closestVirusDistance - myOrganism.size < 600) {
			this.smartShootCount = Math.ceil((91 - (Math.floor(closestVirus.enemy.mass) - 100)) / 13);
		}
		var totalShootableMass = 0;
		var availableShooters = [];
		for (var i=0; i<myOrganism.organisms.length; i++) {
			var currentFriendly = myOrganism.organisms[i];
			var shotsAvailable = Math.ceil((currentFriendly.mass - 32) / 13);
			shotsAvailable = shotsAvailable > 0 ? shotsAvailable : 0;
			totalShootableMass += shotsAvailable;
			if (shotsAvailable > 0) {
				availableShooters.push(shotsAvailable);
			}
		}
		var shotsRequired = 0;
		var rawShotCount = this.smartShootCount;
		while (rawShotCount > 0 && totalShootableMass > 0) {
			var shotAvailable = false;
			for (var i=0; i< availableShooters.length; i++) {
				if (availableShooters[i] > 0) {
					shotAvailable = true;
					availableShooters[i]--;
					totalShootableMass--;
					rawShotCount--;
				}
			}
			if (shotAvailable) {
				shotsRequired++;
			} else {
				break;
			}
		}
		if (rawShotCount < 1) {
			this.smartShootCount = shotsRequired;
		}

	}
	if (this.smartShootCount > 0 && (closestVirus == null || closestVirusDistance > 599)) {
		this.smartShootCount = 0;
	}

	for (var i=0; i< this.impulses.length; i++) {
		var impulse = this.impulses[i];
		var isEnemyVirus = impulse.enemy.isVirus && impulse.threat > -1;

		//aggressive ignores skittles
		if (aggressive && this.opportunity && impulse.threat == -1) {
			continue;
		}

		//Hyper Aggressive behavior ignores non-consume threats
		if (aggressive &&
			this.opportunity &&
			impulse.threat > 0 &&
			impulse.distance > (getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + myOrganism.speed * 2 + 30)) {
			continue;
		}

		//follow through with a split attack
		if (this.attackTarget != null) {
			continue;
		}

		//ignore viruses that I'm not worried about
		if (isEnemyVirus && impulse.worryDistance < impulse.distance) {
			continue;
		}

		//ignore non-threats and non-opportunities
		if (!isEnemyVirus && impulse.threat == 0) {
			continue;
		}

		if (aggressive && isRunning && impulse.threat == -1) {
			continue;
		}

		//In defensive mode, ignore edges that aren't immediate threats
		if (isRunning &&
			myOrganism.organisms.length > 3 &&
			impulse.threat == 999999 &&
			impulse.worryDistance < impulse.distance) {
			continue;
		}

		//ignore minor threats/opportunities
		/*if (isRunning && !this.opportunity && tempArray.length > 0 && biggestImpulse > 1 && Math.abs(impulse.threat * 2) < biggestImpulse) {
			continue;
		}*/

		//ignore threats that are farther away
		if (!isEnemyVirus &&
			isRunning &&
			tempArray.length > 0 &&
			(impulse.distance - impulse.target[0].size - impulse.enemy.size) / 1.75 > closestThreat &&
			Math.abs((impulse.distance - impulse.target[0].size - impulse.enemy.size) - closestThreat) > 30) {
			continue;
		}

		//ignore opportunities that are farther away
		if (!isEnemyVirus &&
			this.opportunity &&
			tempArray.length > 0 &&
			impulse.threat < -1 &&
			(impulse.distance - impulse.target[0].size - impulse.enemy.size) / 1.75 > closestOpportunity &&
			Math.abs((impulse.distance - impulse.target[0].size - impulse.enemy.size) - closestOpportunity) > 30) {
			continue;
		}

		//when threatened, don't show any non-immediate threats
		if (!isEnemyVirus &&
			this.immediateThreats &&
			impulse.worryDistance < impulse.distance &&
			tempArray.length > 0 &&
			impulse.threat != 999999) {
			continue;
		}

		//if not immediately threatened and not running, then skip threats
		if (!isEnemyVirus && !this.immediateThreats && impulse.threat > -1 && this.runCooldown < 1) {
			continue;
		}

		if (!isEnemyVirus &&
			impulse.threat < 1 &&
			(isRunning &&
			(!this.opportunity ||
			!aggressive ||
			impulse.distance < (getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + myOrganism.speed * 2 + 30)))) {
			continue;
		}

		/*//if threatened and running, skip opportunities
		if ((!aggressive || this.immediateThreats) && !isEnemyVirus && isRunning && impulse.threat < 1) {
			continue;
		}*/

		//don't chase people you can't catch
		if (!aggressive && !isEnemyVirus && this.opportunity && !isRunning && impulse.threat < -1 && impulse.enemy.dx != 0 && impulse.worryDistance + 100 < impulse.distance) {
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

	//Use attackTarget
	if (this.attackTarget != null) {
		this.impulses.push(this.attackTarget);
	}

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

		moveDistance = myOrganism.organisms.length > 1 ? impulse.distance + 60 : impulse.distance;

		//Only go with the biggest opportunity
		if (impulse.threat < -1) {
			opportunity = impulse;

			if (impulse.target.length > 0 &&
				canBeSplitAttacked(impulse.enemy, impulse.target[0]) &&
				impulse.worryDistance > impulse.distance &&
				getAngleDifference(impulse.direction, myOrganism.direction) < 16 &&
				this.safeSplit &&
				(myOrganism.organisms.length < 2 ||
				(myOrganism.organisms.length < 3 && organismState.viruses.length > 2) ||
				(!this.threatened)) &&
				impulse.enemy.dx != 0 &&
				this.attackSplitCooldown < 1) {
				shouldSplit = true;
			}
		}

		//defensive split
		if (myOrganism.organisms.length < 3 && this.defenseSplitCooldown < 1 && impulse.target.length > 0 && (impulse.threat > myOrganism.mass / 2 || canBeEaten(myOrganism, impulse.enemy)) &&
			40 + impulse.target[0].size + impulse.enemy.size > impulse.distance &&
			impulse.enemy.speed > 40 &&
			isTravelingTowardsMe(impulse.direction, impulse.distance, impulse.enemy)) {
			shouldSplit = true;
		}
	}

	//TODO adjust for multiple opportunities

	if (this.impulses.length != 0 && this.impulses[0].threat > 0) {
		moveDistance = 400;
	}

	var moveCoords = null;
	if (this.smartShootCount > 0) {
		moveCoords = toCoords(closestVirus.direction,myOrganism.ox, myOrganism.oy,3);
	} else {
		moveCoords = toCoords(moveDirection, myOrganism.ox, myOrganism.oy, moveDistance);
	}

	if (this.opportunity && opportunity != null) {
		moveCoords.x += opportunity.enemy.dx * 5;
		moveCoords.y += opportunity.enemy.dy * 5;

		if (shouldSplit) {
			moveCoords.x += opportunity.enemy.dx * 6;
			moveCoords.y += opportunity.enemy.dy * 6;
		}
	}
	this.moveCoords = moveCoords;
	if (window.botEnabled || this.defenseSplitCooldown > 0 || (shouldSplit && this.impulses[0].threat > 0)) {
		this.move(moveCoords.x, moveCoords.y);
		if (shouldSplit && this.smartShootCount < 1) {
			if (opportunity != null) {
				this.attackTarget = opportunity;
			}
			this.split();
			this.attackSplitCooldown = 40;
			this.defenseSplitCooldown = 20;
		}
	}
	if (this.smartShootCount > 0) {
		this.shoot();
		this.smartShootCount--;
	}
},