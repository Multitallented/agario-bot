/* Display logic */

Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false

var scoreCanvas=$('<canvas id="score-chart" width="200" height="200"></canvas>')
$('body').append(scoreCanvas);
var labels=[],
	data1=[],
	data2=[]
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}
var scoreChart=new Chart(scoreCanvas.get(0).getContext("2d")).Line({labels:labels,datasets:[{
	label: "Current Game Scores",
	fillColor: "rgba(220,220,220,0.2)",
	strokeColor: "rgba(220,220,220,1)",
	data: data1
},
	{
		label: "Past Game Scores",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]});

ai.onTick=function(){
	if(!((this.scoreHistory.length+1)%10)){
		var j=0;
		for(var i=this.scoreHistory.length>100?this.scoreHistory.length-100:0;i<this.scoreHistory.length;i++){
			scoreChart.datasets[0].points[j++].value=~~(this.scoreHistory[i])
		}

		j=0
		for(var i=this.gameHistory.length>10?this.gameHistory.length-10:0;i<this.gameHistory.length;i++){
			var gameStat=this.gameHistory[i];
			scoreChart.datasets[1].points[10*j++].value=~~(gameStat.maxSize)
		}
		scoreChart.update()
	}
}