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
	if (this.smartShootCount < 1 && this.shotLastCooldown) {
		this.shotLastCooldown = false;
		window.shootWarmup = 3;
	}

	makeFriends(organismState);

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

	//If under threat, add threats for near edges
	if (this.threatened) {
		var edgeThreat = createEdgeThreat(myOrganism);
		for(var i=0;i<edgeThreat.length;i++) {
			this.impulses.push(edgeThreat[i]);
		}
	}

	//convert virus threats to opportunities if not threatened
	for (var i=0;i<this.impulses.length; i++) {
		var impulse = this.impulses[i];
		if (impulse.enemy.isVirus && !this.threatened && impulse.threat != 0) {
			impulse.threat = -impulse.enemy.mass;
		}
	}

	//Sort by biggest concern
	this.impulses.sort(impulseSorter);


	this.isRunning = this.immediateThreats || (this.threatened && this.runCooldown > 0);

	this.opportunityOverride = true;
	impulseFilter(this, myOrganism, organismState);

	var runCooldownString = 'Safe Split: ' + (this.safeSplit ? '<span style="color: lightgreen;">True</span>' : '<span style="color: indianindianred;">False</span>');
	runCooldownString += ' Threatened: ' + (this.threatened ? '<span style="color: indianred;">True</span>' : '<span style="color: lightgreen;">False</span>');
	runCooldownString += ' Immediate: ' + (this.immediateThreats ? '<span style="color: indianred;">True</span>' : '<span style="color: lightgreen;">False</span>');
	runCooldownString += '<br>Enabled: ' + (window.botEnabled ? '<span style="color: lightgreen;">True</span>' : '<span style="color: dodgerblue;">False</span>');
	runCooldownString += ' Opportunity: ' + (this.opportunity ? '<span style="color: lightgreen;">True</span>' : '<span style="color: dodgerblue;">False</span>');
	runCooldownString += ' Aggressive: ' + (aggressive ? '<span style="color: indianred;">True</span>' : '<span style="color: lightgreen;">False</span>');
	runCooldownString += '<br>Split: ' + (!dontSplit ? '<span style="color: lightgreen;">Enabled</span>' : '<span style="color: indianred;">Disabled</span>');
	runCooldownString += ' Cooldown: ' + (!this.shotLastCooldown ? '<span style="color: lightgreen;">No</span>' : '<span style="color: indianred;">Yes</span>');
	runCooldownString += ' (' + this.smartShootCount + ')';
	$runCooldown.html(runCooldownString);

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
				(this.isRunning && currentGap > gap) ||
				(!this.isRunning && currentGap < gap));
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
				this.attackSplitCooldown < 1 &&
				myOrganism.size < 1000 &&
				(!impulse.enemy.name || feedList.indexOf(impulse.enemy.name) == -1)) {
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

	//Check to make sure I can split safely
	if (shouldSplit) {
		var splitCoords = toCoords(moveDirection, myOrganism.ox, myOrganism.oy, getSplitDistance(myOrganism));
		for (var i=0; i<organismState.enemies.length; i++) {
			var currentEnemy = organismState.enemies[i];
			var currentDistance = distance(currentEnemy, {ox: splitCoords.x, oy: splitCoords.y});
			for (var j=0; j<myOrganism.organisms.length; j++) {
				var cuFriendly = myOrganism.organisms[j];
				if (canBeEaten(cuFriendly, currentEnemy) && !tooBigToWorry(myOrganism, currentEnemy) &&
					(getConsumeDistance(impulse.enemy, currentEnemy) * 1.15 + 50 + cuFriendly.speed * 2 > currentDistance ||
					(canBeSplitEaten(cuFriendly, currentEnemy) &&
					getSplitDistance(currentEnemy) + 40 > currentDistance))) {
					shouldSplit = false;
					runCooldownString += '<br>Target split not safe';
					$runCooldown.html(runCooldownString);
					break;
				}
			}
			if (!shouldSplit) {
				break;
			}
		}
	}

	if (this.impulses.length != 0 && this.impulses[0].threat > 0) {
		moveDistance = 700;
	}

	var moveCoords = null;
	if (this.smartShootCount > 0 || this.shotLastCooldown) {
		moveCoords = toCoords(this.closestVirus.direction,window.innerWidth / 2, window.innerHeight / 2,20);
		moveCoords.x = Math.floor(moveCoords.x);
		moveCoords.y = Math.floor(moveCoords.y);
	} else {
		moveCoords = toCoords(moveDirection, myOrganism.ox, myOrganism.oy, moveDistance);
	}

	//account for momentum if chasing someone
	if (this.opportunity && opportunity != null && this.smartShootCount < 1 && !this.shotLastCooldown) {
		moveCoords.x += opportunity.enemy.dx * 5;
		moveCoords.y += opportunity.enemy.dy * 5;

		if (shouldSplit) {
			moveCoords.x += opportunity.enemy.dx * 6;
			moveCoords.y += opportunity.enemy.dy * 6;
		}
	}
	this.moveCoords = moveCoords;

	//async shoot
	if (this.smartShootCount > 0 && !this.shotLastCooldown) {
		this.shotLastCooldown = true;

		if (!window.dontShoot) {
			for (var i = 0; i < this.smartShootCount; i++) {
				setTimeout(pressW, i * 80 + 40);
			}
		}
		setTimeout(function() {
			window.ai.shotLastCooldown = false;
		}, this.smartShootCount * 80 + 41);
		this.smartShootCount = 0;
		this.move(moveCoords.x, moveCoords.y);
	}

	window.botOverride = (this.defenseSplitCooldown > 0 || (shouldSplit && this.impulses[0].threat > 0));
	if ((window.botEnabled || window.botOverride) && !this.shotLastCooldown) {
		this.move(moveCoords.x, moveCoords.y);
		if (shouldSplit && this.smartShootCount < 1 && !dontSplit) {
			if (opportunity != null) {
				this.attackTarget = opportunity;
			}
			this.split();
			this.attackSplitCooldown = 40;
			this.defenseSplitCooldown = 20;
		}
	}
},