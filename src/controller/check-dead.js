function checkDead(bot, myOrganisms, score) {
	if (myOrganisms.length<1) {
		if(bot.currentState!='dead'){
			bot.gameHistory.push([
				bot.lastStateChangeDate,
				new Date,
				bot.scoreHistory
			]);

			if (bot.lastStateChangeDate == null) {
				bot.lastStateChangeDate = new Date;
			}
			console.log("DEAD x_X");
			console.log("Score",~~(bot.scoreHistory[bot.scoreHistory.length-1]/100))
			console.log("Time spent alive",(Date.now()-bot.lastStateChangeDate.getTime())/60000,"mins")
			bot.scoreHistory=[];
			bot.lastStateChangeDate=new Date;
		}
		bot.currentState='dead';
		return false;
	}
	if (bot.currentState!='alive'){
		bot.lastStateChangeDate=new Date;
	}
	bot.scoreHistory.push(score);

	if(!(bot.scoreHistory.length%10)){
		var j=0;
		for(var i=bot.scoreHistory.length>100?bot.scoreHistory.length-100:0;i<bot.scoreHistory.length;i++){
			/*
			 if(j){
			 chart.datasets[0].points[j].value=~~((bot.scoreHistory[i]-bot.scoreHistory[i-1])/100)
			 }
			 j++
			 */
			chart.datasets[0].points[j++].value=~~(bot.scoreHistory[i]/100)
		}

		j=0;
		for(var i=bot.gameHistory.length>10?bot.gameHistory.length-10:0;i<bot.gameHistory.length;i++){
			var gameStats=bot.gameHistory[i];
			chart.datasets[1].points[10*j++].value=~~(gameStats[2][gameStats[2].length-1]/100)
		}
		chart.update();
	}

	bot.currentState='alive';
	return true;
}