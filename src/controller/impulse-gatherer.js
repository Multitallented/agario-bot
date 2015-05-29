function gatherImpulses(organismState, myOrganism, bot) {
	var impulses = [];

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

		for (var j=0; j<myOrganism.organisms.length; j++) {
			var currentFriendly = myOrganism.organisms[j];
			var currentDistance = distance(currentEnemy, currentFriendly);
			var currentDirection = toDegrees(currentFriendly.ox, currentFriendly.oy, currentEnemy.ox, currentEnemy.oy);
			var consumeThreat = canBeEaten(currentFriendly, currentEnemy);
			var splitThreat = consumeThreat ? canBeSplitEaten(currentFriendly, currentEnemy) : false;
			var consumeOpportunity = consumeThreat ? false : canBeEaten(currentEnemy, currentFriendly);
			var splitOpportunity = consumeOpportunity ? canBeSplitEaten(currentEnemy, currentFriendly) : false;
			var currentThreat = consumeThreat ? currentFriendly.mass : consumeOpportunity ? currentEnemy.mass * -1 : 0;

			var relativeDirection = toDegrees(myOrganism.ox, myOrganism.oy, currentFriendly.ox, currentFriendly.oy);
			var directionDifference = getAngleDifference(currentDirection, relativeDirection);
			var relativeDistance = distance(currentFriendly, myOrganism) * Math.cos(directionDifference);

			//check for safe split
			if (consumeThreat && !tooBigToWorry(myOrganism, currentEnemy) && currentDistance < getSplitDistance(currentEnemy) + getConsumeDistance(currentFriendly, currentEnemy)) {
				bot.safeSplit = false;
			}

			//Override Threat if closest opportunity
			if (closestDistance > currentDistance) {
				closestDistance = currentDistance;
				direction = currentDirection;

				if (currentThreat < 0) {
					opportunityMass = currentThreat;

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
				currentOpportunityDistance += getSplitDistance(currentFriendly) + getConsumeDistance(currentEnemy, currentFriendly);
			} else if (consumeThreat) {
				currentWorryDistance += getConsumeDistance(currentFriendly, currentEnemy) + currentFriendly.speed * 4;
			} else if (consumeOpportunity) {
				currentOpportunityDistance += getConsumeDistance(currentEnemy, currentFriendly);
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

		if (opportunityMass > 0) {
			threat = -1 * opportunityMass;
			worryDistance = opportunityDistance;
			label = 'Eat ' + currentEnemy.name;
			color = '#00FF00';
		}

		if (threat > 0) {
			bot.threatened = true;

			if (worryDistance > closestDistance) {
				bot.immediateThreats = true;
			}
		}

		//Always create new impulse
		impulses.push(new Impulse(
			threat,
			currentEnemy,
			threatArray,
			closestDistance,
			worryDistance,
			direction,
			label,
			color
		));
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
				worryDistance = getConsumeDistance(currentVirus, currentFriendly) + relativeDistance + currentFriendly.speed * 2;
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
		}

		if (threat != 0) {
			impulses.push(new Impulse(
				threat,
				currentVirus,
				threatArray,
				closestDistance,
				worryDistance,
				direction,
				label,
				color
			));
		}
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

	return impulses;
}