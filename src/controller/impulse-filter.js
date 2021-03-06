function impulseFilter(bot, myOrganism, organismState) {
	//========================
	//remove excess impulses
	var tempArray = [];
	var previousThreat = 0;
	var closestThreat = 999999;
	var closestOpportunity = 999999;
	bot.closestVirus = null;
	var closestVirusDistance = 999999;
	var chaseImpulse = null;
	for (var i=0; i< bot.impulses.length; i++) {
		var impulse = bot.impulses[i];
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
			bot.closestVirus = impulse;
		}

		if (impulse.threat == 999999) {
			continue;
		}

		if (chaseList.length > 0 && impulse.threat < -1 && impulse.enemy.name && chaseList.indexOf(impulse.enemy.name) > -1) {
			chaseImpulse = impulse;
		}
	}

	//Shoot mass behavior
	if (smartShoot && bot.smartShootCount < 1) {
		smartShoot = false;
		if (bot.closestVirus != null && closestVirusDistance - myOrganism.size < 600) {
			bot.smartShootCount = Math.ceil((91 - (Math.floor(bot.closestVirus.enemy.mass) - 100)) / 13);
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
		var rawShotCount = bot.smartShootCount;
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
			bot.smartShootCount = shotsRequired;
		} else {
			bot.smartShootCount = 0;
		}

	}
	if (bot.smartShootCount > 0 && (bot.closestVirus == null || closestVirusDistance > 599)) {
		bot.smartShootCount = 0;
	}

	for (var i=0; i< bot.impulses.length; i++) {
		var impulse = bot.impulses[i];

		//Chasers
		if (chaseImpulse != null && !this.immediateThreats) {
			tempArray = [];
			tempArray.push(chaseImpulse);
			break;
		}

		//Feed people on feeder list
		if (feedList.length > 0 && impulse.enemy.name && feedList.indexOf(impulse.enemy.name) > -1) {
			if (impulse.threat < 1) {
				continue;
			}

			if (!bot.immediateThreats || (i == 0 && impulse.enemy.mass < 299)) {
				tempArray = [];
				impulse.threat = -999999;
				tempArray.push(impulse);
				break;
			} else {
				impulse.threat = -impulse.enemy.mass;
			}
		}

		//Don't eat or worry about friends
		if (friendList.length > 0 && impulse.enemy.name && friendList.indexOf(impulse.enemy.name) > -1) {
			if (impulse.threat < 1) {
				continue;
			} else if (impulse.target.length < 1 ||
				impulse.distance > getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + 60) {
				impulse.threat = -2;
			}
		}

		var isEnemyVirus = impulse.enemy.isVirus && impulse.threat > -1;

		//aggressive ignores skittles
		if (aggressive && bot.opportunity && impulse.threat == -1) {
			continue;
		}

		//Hyper Aggressive behavior ignores non-consume threats
		if (aggressive &&
			bot.opportunity &&
			impulse.threat > 0 &&
			impulse.distance > (getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + myOrganism.speed * 2 + 30)) {
			continue;
		}

		//follow through with a split attack
		if (bot.attackTarget != null) {
			continue;
		}

		//ignore viruses that I'm not worried about
		if (isEnemyVirus && impulse.worryDistance < impulse.distance) {
			continue;
		}

		//ignore non-threats and non-opportunities
		if (impulse.threat == 0) {
			continue;
		}

		//aggressive mode bot doesn't eat skittles. it hunts
		if (aggressive && bot.isRunning && impulse.threat == -1) {
			continue;
		}

		//In defensive mode, ignore edges that aren't immediate threats
		if (bot.isRunning &&
			myOrganism.organisms.length > 3 &&
			impulse.threat == 999999 &&
			impulse.worryDistance < impulse.distance) {
			continue;
		}

		//ignore threats that are farther away
		if (!isEnemyVirus &&
			bot.isRunning &&
			tempArray.length > 0 &&
			(impulse.distance - impulse.target[0].size - impulse.enemy.size) / 1.75 > closestThreat &&
			Math.abs((impulse.distance - impulse.target[0].size - impulse.enemy.size) - closestThreat) > 30) {
			continue;
		}

		//ignore opportunities that are farther away
		if (!isEnemyVirus &&
			bot.opportunity &&
			tempArray.length > 0 &&
			impulse.threat < -1 &&
			(impulse.distance - impulse.target[0].size - impulse.enemy.size) / 1.75 > closestOpportunity &&
			Math.abs((impulse.distance - impulse.target[0].size - impulse.enemy.size) - closestOpportunity) > 30) {
			continue;
		}

		//when threatened, don't show any non-immediate threats
		if (!isEnemyVirus &&
			bot.immediateThreats &&
			impulse.worryDistance < impulse.distance &&
			tempArray.length > 0 &&
			impulse.threat != 999999) {
			continue;
		}

		//if not immediately threatened and not running, then skip threats
		if (!isEnemyVirus && !bot.immediateThreats && impulse.threat > -1 && bot.runCooldown < 1) {
			continue;
		}

		if (!isEnemyVirus &&
			impulse.threat < 1 &&
			(bot.isRunning &&
			(!bot.opportunity ||
			!aggressive ||
			impulse.distance < (getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + myOrganism.speed * 2 + 30)))) {
			continue;
		}

		//if threatened and running, skip opportunities
		/*if ((!aggressive || impulse.distance <= (getConsumeDistance(impulse.target[0], impulse.enemy) * 1.15 + myOrganism.speed * 2 + 30)) &&
			!isEnemyVirus &&
			bot.isRunning &&
			impulse.threat < 1) {
			continue;
		}*/

		//don't chase people you can't catch
		if (!aggressive &&
			!(myOrganism.mass > 1199 && myOrganism.organisms.length < 2) &&
			!isEnemyVirus &&
			bot.opportunity &&
			!bot.isRunning &&
			impulse.threat < -1 &&
			impulse.enemy.dx != 0 &&
			impulse.worryDistance + 100 < impulse.distance) {
			continue;
		}

		//Don't go for targets that are already threatened
		if (impulse.threat < 0) {
			var tooRisky = false;
			for (var j=0; j<organismState.enemies.length; j++) {
				if (tooRisky) {
					break;
				}
				var cEnemy = organismState.enemies[j];
				var cDistance = distance(impulse.enemy, cEnemy);
				for (var k=0; k<myOrganism.organisms.length; k++) {
					var cFriendly = myOrganism.organisms[k];
					if (canBeEaten(cFriendly, cEnemy) && !tooBigToWorry(myOrganism, cEnemy) &&
						(getConsumeDistance(impulse.enemy, cEnemy) * 1.15 + 80 + cFriendly.speed * 2 > cDistance ||
						(canBeSplitEaten(cFriendly, cEnemy) &&
						getSplitDistance(cEnemy) + 80 > cDistance))) {
						tooRisky = true;
						break;
					}
				}
			}
			if (tooRisky) {
				continue;
			}
		}

		if (previousThreat < 0) {
			continue;
		}
		tempArray.push(impulse);
		if (previousThreat > -1) {
			previousThreat = impulse.threat;
		}
	}

	var smallestThreat = 999999;
	var biggestThreat = -999999;
	for (var i=0; i<tempArray.length; i++) {
		var impulse = tempArray[i];

		smallestThreat = Math.min(smallestThreat, impulse.threat);
		biggestThreat = Math.max(biggestThreat, impulse.threat);
	}
	var opportunityOverride = biggestThreat < Math.abs(smallestThreat);
	tempArray.filter(function(a) {
		return opportunityOverride ? a.threat < 1 : a.threat > 0;
	});

	bot.impulses = tempArray;

	//Use attackTarget
	if (bot.attackTarget != null) {
		bot.impulses.push(bot.attackTarget);
	}

	//If no impulses, then retry in a different mode or go to center of the map
	if (bot.impulses.length < 1) {
		if (!bot.threatened) {
			bot.impulses.push(new Impulse(-1,
				{name: 'Center Map', ox: 5600, oy: 5600, dx: 0, dy: 0, mass: 1},
				myOrganism.organisms,
				distance({ox: 5600, oy: 5600}, myOrganism),
				0,
				toDegrees(myOrganism.ox, myOrganism.oy, 5600, 5600),
				'Center Map',
				'#0000FF'));
		} else if (!bot.isRunning) {
			bot.runCooldown = 40;
			bot.isRunning = true;
			impulseFilter(bot, myOrganism, organismState);
		} else {
			bot.threatened = false;
			bot.isRunning = false;
			bot.immediateThreats = false;
			bot.runCooldown = 0;
			impulseFilter(bot, myOrganism, organismState);
		}
	}
}