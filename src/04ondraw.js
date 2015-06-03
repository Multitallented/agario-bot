draw:function(ctx){

	//Impulses
	for (var i = 0; i < this.impulses.length; i++) {
		var impulse = this.impulses[i];

		if (impulse.target == null || impulse.target.length < 1) {
			ctx.beginPath();

			ctx.strokeStyle = impulse.threat > 0 ? 'red' : 'green';
			ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
			ctx.lineTo(impulse.enemy.ox, impulse.enemy.oy);
			ctx.stroke();
		} else {
			for (var j = 0; j < impulse.target.length; j++) {
				ctx.beginPath();

				ctx.strokeStyle = impulse.threat > 0 ? 'red' : 'green';
				ctx.moveTo(impulse.target[j].ox, impulse.target[j].oy);
				ctx.lineTo(impulse.enemy.ox, impulse.enemy.oy);
				ctx.stroke();
			}
		}
	}

	//Move Direction
	ctx.beginPath();
	ctx.strokeStyle = 'blue';
	ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
	ctx.lineTo(this.moveCoords.x, this.moveCoords.y);
	ctx.stroke();
}
};