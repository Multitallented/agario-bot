draw:function(ctx){

	//Impulses
	for (var i = 0; i < this.impulses.length; i++) {
		var impulse = this.impulses[i];

		if (impulse.target == null || impulse.target.length < 1) {
			ctx.beginPath();

			ctx.strokeStyle = impulse.threat > 0 ? 'indianred' : 'lightgreen';
			ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
			ctx.lineTo(impulse.enemy.ox, impulse.enemy.oy);
			ctx.stroke();
		} else {
			for (var j = 0; j < impulse.target.length; j++) {
				ctx.beginPath();

				ctx.strokeStyle = impulse.threat > 0 ? 'indianred' : 'lightgreen';
				ctx.moveTo(impulse.target[j].ox, impulse.target[j].oy);
				ctx.lineTo(impulse.enemy.ox, impulse.enemy.oy);
				ctx.stroke();
			}
		}
	}

	//closest virus
	if (this.closestVirus != null && this.closestVirus.distance < 660) {
		ctx.beginPath();
		ctx.strokeStyle = 'yellow';
		ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);

		var virusDegrees = toDegrees(this.myOrganism.ox, this.myOrganism.oy, this.closestVirus.enemy.ox, this.closestVirus.enemy.oy);
		var virusCoords = toCoords(virusDegrees, this.myOrganism.ox, this.myOrganism.oy, this.closestVirus.distance + 660);
		ctx.lineTo(virusCoords.x, virusCoords.y);
		ctx.stroke();
	}

	//Move Direction
	ctx.beginPath();
	ctx.strokeStyle = 'dodgerblue';
	ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
	ctx.lineTo(this.moveCoords.x, this.moveCoords.y);
	ctx.stroke();
}
};