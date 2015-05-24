onDraw:function(ctx,myOrganisms){
	if (myOrganisms == undefined || myOrganisms == null || myOrganisms.length < 1) {
		return;
	}
	var totalSize = 0;
	for (var i=0; i< myOrganisms.length; i++) {
		totalSize += myOrganisms[i].size;
	}
	var myOrganism=getGeneralOrganism(myOrganisms, totalSize);
	var threatCount = 0;
	var absoluteTotalThreat = 0;
	var currentEscapeDirection = 0;
	for (var i=0; i<this.impulses.length; i++) {
		var impulse = this.impulses[i];
		ctx.beginPath();

		if(impulse.threat > 0){
			threatCount++;
			absoluteTotalThreat += Math.abs(impulse.threat);
			currentEscapeDirection += toDegrees(myOrganism.ox, myOrganism.oy, impulse.x, impulse.y) * impulse.threat;
			ctx.strokeStyle='red';
		} else {
			ctx.strokeStyle='green';
		}
		ctx.moveTo(myOrganism.ox,myOrganism.oy);
		ctx.lineTo(impulse.x, impulse.y);
		ctx.stroke();
	}
	if (threatCount > 0) {
		currentEscapeDirection = sanitizeDegrees(currentEscapeDirection / absoluteTotalThreat + 180);
		var escapeCoords = toCoords(currentEscapeDirection, myOrganism.ox, myOrganism.oy, 400);
		ctx.beginPath();
		ctx.strokeStyle='blue';
		ctx.moveTo(myOrganism.ox,myOrganism.oy);
		ctx.lineTo(escapeCoords.x, escapeCoords.y);
		ctx.stroke();
	}

	//Draw dodgeDistance
	// var dodgeCoords = toCoords(15, myOrganism.ox, myOrganism.oy, getRadius(myOrganism.size) + this.dodgeDistance);
	// ctx.beginPath();
	// ctx.strokeStyle = 'black';
	// ctx.moveTo(myOrganism.ox,myOrganism.oy);
	// ctx.lineTo(dodgeCoords.x, dodgeCoords.y);
	// ctx.stroke();

	for (var i=0; i<this.threatEscapeVectors.length; i++) {
		var consumptionCoords = toCoords(this.threatEscapeVectors[i], myOrganism.ox, myOrganism.oy, 200);
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.moveTo(myOrganism.ox,myOrganism.oy);
		ctx.lineTo(consumptionCoords.x, consumptionCoords.y);
		ctx.stroke();
	}

	if (this.otherOrganisms != undefined) {
		for (var i=0; i<this.otherOrganisms.length; i++) {
			var currentOrganism = this.otherOrganisms[i];
			if (currentOrganism == undefined || currentOrganism.isVirus) {
				continue;
			}
			//Draw consumption distance
			if (canBeSplitEaten(myOrganism, currentOrganism) && getMass(myOrganism.size) * 6 > getMass(currentOrganism.size)) {
				var consumptionCoords = toCoords(toDegrees(myOrganism.ox, myOrganism.oy, currentOrganism.ox, currentOrganism.oy), 
												 myOrganism.ox, 
												 myOrganism.oy, 
												 calcSplitDistance(myOrganism, currentOrganism) + this.dodgeDistance - getRadius(myOrganism.size) - getRadius(currentOrganism.size));
				ctx.beginPath();
				ctx.strokeStyle = 'cyan';
				ctx.moveTo(myOrganism.ox,myOrganism.oy);
				ctx.lineTo(consumptionCoords.x, consumptionCoords.y);
				ctx.stroke();
			} else if (canBeEaten(myOrganism, currentOrganism)) {
				var splitCoords = toCoords(toDegrees(myOrganism.ox, myOrganism.oy, currentOrganism.ox, currentOrganism.oy), 
									       myOrganism.ox, 
									       myOrganism.oy, 
									       consumptionDistance(myOrganism, currentOrganism) + this.dodgeDistance - getRadius(myOrganism.size) - getRadius(currentOrganism.size));
				ctx.beginPath();
				ctx.strokeStyle = 'black';
				ctx.moveTo(myOrganism.ox,myOrganism.oy);
				ctx.lineTo(splitCoords.x, splitCoords.y);
				ctx.stroke();
			}
		}
	}
}
};