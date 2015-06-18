function gatherImpulses(organismState, myOrganism, bot) {
	var impulses = [];
	var attackTargetUpdated = false;

	//Enemy Impulses
	for (var i=0; i<organismState.enemies.length; i++) {
		var currentEnemy = organismState.enemies[i];
		var threat = 0;
		var threatArray = [];
		var closestDistance = 999999;
		var direction = -1;
		var color= '#0000FF';
		var label = 'Default';
		var threatCount = 0;
		var opportunityMass = 0;
		var worryDistance = 0;
		var opportunityDistance = 0;
		var closestFriendly = null;

		for (var j=0; j<myOrganism.organisms.length; j++) {
			var currentFriendly = myOrganism.organisms[j];
			var currentDistance = distance(currentEnemy, currentFriendly);
			var currentDirection = toDegrees(currentFriendly.ox, currentFriendly.oy, currentEnemy.ox, currentEnemy.oy);
			var consumeThreat = canBeEaten(currentFriendly, currentEnemy);
			var splitThreat = consumeThreat ? canBeSplitEaten(currentFriendly, currentEnemy) : false;
			var consumeOpportunity = consumeThreat ? false : canBeEaten(currentEnemy, currentFriendly);
			var splitOpportunity = consumeOpportunity ? currentFriendly.mass > 44 && canBeSplitAttacked(currentEnemy, currentFriendly) : false;
			var currentThreat = consumeThreat ? currentFriendly.mass : consumeOpportunity ? currentEnemy.mass * -1 : 0;

			var relativeDirection = toDegrees(myOrganism.ox, myOrganism.oy, currentFriendly.ox, currentFriendly.oy);
			var directionDifference = getAngleDifference(currentDirection, relativeDirection);
			var relativeDistance = distance(currentFriendly, myOrganism) * Math.cos(directionDifference);

			//check for safe split
			if (consumeThreat && !tooBigToWorry(myOrganism, currentEnemy) &&
				(currentDistance < getSplitDistance(currentEnemy) + getConsumeDistance(currentFriendly, currentEnemy) ||
				currentDistance < getConsumeDistance(currentFriendly, currentEnemy))) {
				bot.safeSplit = false;
			}

			//Override Threat if closest opportunity
			if (closestDistance > currentDistance) {
				closestDistance = currentDistance;
				direction = currentDirection;

				if (threat > 0 && currentThreat > 0 && threatArray.length > 0) {
					direction = toDegrees(myOrganism.ox, myOrganism.oy, currentEnemy.ox, currentEnemy.oy);
				}

				if (currentThreat < 0) {
					opportunityMass = currentThreat;
					closestFriendly = currentFriendly;

				} else {
					opportunityMass = 0;
				}
			}

			//Find worry distance
			var currentOpportunityDistance = relativeDistance;
			var currentWorryDistance = relativeDistance;
			if (directionDifference > 90) {
				currentOpportunityDistance = currentOpportunityDistance * -1;
				currentWorryDistance = currentWorryDistance * -1;
			}
			if (splitThreat && !tooBigToWorry(currentFriendly, currentEnemy)) {
				currentWorryDistance += getSplitDistance(currentEnemy) + getConsumeDistance(currentFriendly, currentEnemy) + currentFriendly.speed * 2;
			} else if (splitOpportunity && !tooBigToWorry(currentEnemy, currentFriendly)) {
				currentOpportunityDistance += getSplitDistance(currentFriendly) - 40;
			} else if (consumeThreat) {
				currentWorryDistance += getConsumeDistance(currentFriendly, currentEnemy) * 1.15 + currentFriendly.speed * 2 + 50;
			} else if (consumeOpportunity) {
				currentOpportunityDistance += getConsumeDistance(currentEnemy, currentFriendly) + 50;
			}

			worryDistance = Math.max(currentWorryDistance, worryDistance);
			opportunityDistance = Math.max(currentOpportunityDistance, opportunityDistance);

			//Add to threat
			if (currentThreat > 0) {
				threatCount++;
				threat += currentThreat;
				threatArray.push(currentFriendly);
			}
		}

		//don't chase enemies that are about to combine
		var safeChase = true;
		for (var j=0; j<organismState.enemies.length; j++) {
			var sameEnemy = organismState.enemies[j];
			if (sameEnemy.name != currentEnemy.name || sameEnemy.ox == currentEnemy.ox) {
				continue;
			}
			if (distance(sameEnemy, currentEnemy) < sameEnemy.size + currentEnemy.size) {
				safeChase = false;
				break;
			}
		}

		if ((consumeOpportunity || splitOpportunity) && opportunityMass < 0 && safeChase) {
			threat = opportunityMass;
			worryDistance = opportunityDistance;
			label = 'Eat ' + currentEnemy.name;
			color = '#00FF00';
			bot.opportunity = true;
			threatArray.push(closestFriendly);
		}

		if (threat > 0) {
			bot.threatened = true;

			if (myOrganism.mass < 51) {
				worryDistance += 20;
			}
			if (myOrganism.mass < 100) {
				worryDistance += 20;
			}

			if (worryDistance > closestDistance) {
				bot.immediateThreats = true;
			}
		}

		//sort target array by distance
		threatArray.sort(function(a, b) {
			return a.distance - b.distance;
		});

		if (threat > 0 && myOrganism.mass < 51) {
			worryDistance += 20;
		}

		//Always create new impulse
		var newImpulse = new Impulse(
			threat,
			currentEnemy,
			threatArray,
			closestDistance,
			worryDistance,
			direction,
			label,
			color
		);
		impulses.push(newImpulse);

		//Update current attack target
		if (bot.attackTarget != null &&
			bot.attackTarget.enemy.name == currentEnemy.name &&
			Math.abs(bot.attackTarget.enemy.ox - currentEnemy.ox) < 40 &&
			Math.abs(bot.attackTarget.enemy.oy - currentEnemy.oy) < 40) {

			newImpulse.threat = -1 * newImpulse.enemy.mass;
			newImpulse.worryDistance = 999999;
			bot.attackTarget = newImpulse;
			attackTargetUpdated = true;
		}
	}
	//target lost
	if (!attackTargetUpdated) {
		bot.attackTarget = null;
		bot.attackSplitCooldown = 0;
	}

	//Viruses
	for (var i=0; i<organismState.viruses.length; i++) {
		var currentVirus = organismState.viruses[i];
		var threat = 0;
		var threatArray = [];
		var label = 'Virus';
		var color = '#FF0000';
		var closestDistance = 999999;
		var direction = -1;


		for (var j=0; j<myOrganism.organisms.length; j++) {
			var currentFriendly = myOrganism.organisms[j];
			if (!canBeEaten(currentVirus, currentFriendly)) {
				continue;
			}

			if (myOrganism.organisms.length < 16) {
				threat += currentFriendly.mass * 0.6;
			} else {
				threat = -1 * currentVirus.mass;
			}

			var currentDirection = toDegrees(currentFriendly.ox, currentFriendly.oy, currentVirus.ox, currentVirus.oy);
			var relativeDirection = toDegrees(myOrganism.ox, myOrganism.oy, currentFriendly.ox, currentFriendly.oy);
			var directionDifference = getAngleDifference(currentDirection, relativeDirection);
			var relativeDistance = distance(currentFriendly, myOrganism);
			if (directionDifference > 90) {
				directionDifference = 180 - directionDifference;
				relativeDistance = relativeDistance * -1;
			}
			var relativeDistance = relativeDistance * Math.cos(directionDifference);

			threatArray.push(currentFriendly);
			var currentDistance = distance(currentFriendly, currentVirus);
			if (currentDistance < closestDistance) {
				closestDistance = currentDistance;
				direction = toDegrees(currentFriendly.ox, currentFriendly.oy, currentVirus.ox, currentVirus.oy);
				worryDistance = getConsumeDistance(currentVirus, currentFriendly) + relativeDistance + currentFriendly.speed + 15;
			}
		}

		if (threat > 0) {
			label = 'Virus Threat';
			color = '#FF0000';
			bot.threatened = true;
			if (worryDistance > closestDistance) {
				bot.immediateThreats = true;
			}
		} else {
			label = 'Virus Eat';
			color = '#00FF00';
			this.opportunity = true;
		}
		if (isNaN(threat)) {
			threat = 0;
		}

		impulses.push(new Impulse(
			Math.floor(threat),
			currentVirus,
			threatArray,
			closestDistance,
			worryDistance,
			direction,
			label,
			color
		));
	}

	//Skittles
	for (var i=0; i<organismState.skittles.length; i++) {
		var currentSkittle = organismState.skittles[i];
		var nearestDistance  = 999999;
		var closestFriendly = null;

		for (var j=0; j<myOrganism.organisms.length; j++) {
			var currentFriendly = myOrganism.organisms[j];
			var currentDistance = distance(currentFriendly, currentSkittle);
			if (currentDistance < nearestDistance) {
				closestFriendly = currentFriendly;
				nearestDistance = currentDistance;
			}
		}

		if (closestFriendly != null) {

			impulses.push(new Impulse(
				-1, //threat
				currentSkittle, //enemy
				[ closestFriendly ], //my concerned organisms
				nearestDistance, //closest distance from concerned organisms
				0, //worry distance
				toDegrees(closestFriendly.ox, closestFriendly.oy, currentSkittle.ox, currentSkittle.oy), //direction
				'Skittle', //label
				'#FF0000'
			));
		}
	}

	//TODO combine multiple opportunities I can eat

	return impulses;
}