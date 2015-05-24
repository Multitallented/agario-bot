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