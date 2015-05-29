draw:function(ctx){

	//Impulses
	for (var i = 0; i < this.impulses.length; i++) {
		var impulse = this.impulses[i];

		ctx.beginPath();

		ctx.strokeStyle = impulse.threat > 0 ? 'red' : 'green'
		if (impulse.target == null || impulse.target.length < 1) {
			ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
		} else {
			ctx.moveTo(impulse.target[0].ox, impulse.target[0].oy);
		}
		ctx.lineTo(impulse.enemy.ox, impulse.enemy.oy);
		ctx.stroke();
	}

	//Move Direction
	ctx.beginPath();
	ctx.strokeStyle = 'blue';
	ctx.moveTo(this.myOrganism.ox, this.myOrganism.oy);
	ctx.lineTo(this.moveCoords.x, this.moveCoords.y);
	ctx.stroke();
}
};