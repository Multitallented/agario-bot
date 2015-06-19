function updateBehaviorChart(impulses, theBehaviorChart) {
	for (var j=0; j<theBehaviorChart.segments.length; j++) {
		theBehaviorChart.segments[j].value = 0;
	}
	for(var i=0; i<impulses.length; i++) {
		if (impulses[i] == null) {
			continue;
		}
		if (i==0) {
			document.getElementById('behavior-char-title').textContent = impulses[i].label;
		}
		for (var j=0; j<theBehaviorChart.segments.length; j++) {
			if (impulses[i].label.indexOf(theBehaviorChart.segments[j].label) == -1) {
				continue;
			}
			theBehaviorChart.segments[j].value = Math.abs(impulses[i].threat);
		}
	}
	theBehaviorChart.update();
}
//Map is 11200x11200
$body = $('body');
Chart.defaults.Line.pointDot=false
Chart.defaults.Line.showScale=false
Chart.defaults.global.responsive=false
var canvas=$('<canvas id="score-history-chart" width="200" height="200" style="position:fixed"></canvas>')
$body.append(canvas);
var ctx=canvas.get(0).getContext("2d")
var labels=[],
	data1=[],
	data2=[]
for(var i=0;i<100;i++){
	labels.push(i)
	data1.push(0)
	data2.push(0)
}

var chart=new Chart(ctx).Line({labels:labels,datasets:[{
	label: "Score History",
	fillColor: "rgba(220,220,220,0.2)",
	strokeColor: "rgba(220,220,220,1)",
	data: data1
},
	{
		label: "Game History",
		fillColor: "rgba(151,187,205,1)",
		strokeColor: "rgba(151,187,205,1)",
		data:data2
	}
]});
var $friendList = $('<div id="friend-list" style="position: fixed; bottom: 0; right: 0;"><p></p></div>');
$body.append($friendList);

var $addForm = $('<form id="add-friend"><input type="text" placeholder="Add Friend" /></form>');
$friendList.append($addForm);
var $addTextField = $addForm.find('input');
$addTextField.focus(function() {
	keyControls = false;
});
$addTextField.blur(function() {
	keyControls = true;
	$addTextField.val('');
});
$addForm.submit(function(e) {
	e.preventDefault();
	var inputString = $addTextField.val();
	if (inputString.indexOf('fr:') > -1) { //friend
		friendList.push(inputString.replace('fr:', ''));
	} else if (inputString.indexOf('fe:') > -1) { //feed
		feedList.push(inputString.replace('fe:', ''));
	} else if (inputString.indexOf('ch:') > -1) { //chase
		chaseList.push(inputString.replace('ch:', ''));
	} else { //enemy
		enemyList.push(inputString);
	}
	$addTextField.val('');
	updateList();
	return false;
});

function updateList() {
	var listString = '';
	for (var i=0; i<friendList.length; i++) {
		listString += '<a href="#" style="color: lightgreen;">' + friendList[i] + '</a><br>';
	}
	for (var i=0; i<enemyList.length; i++) {
		listString += '<a href="#" style="color: indianred;">' + enemyList[i] + '</a><br>';
	}
	for (var i=0; i<feedList.length; i++) {
		listString += '<a href="#" style="color: dodgerblue;">' + feedList[i] + '</a><br>';
	}
	for (var i=0; i<chaseList.length; i++) {
		listString += '<a href="#" style="color: red;">' + chaseList[i] + '</a><br>';
	}
	$('#friend-list p').html(listString);
	$('#friend-list p a').click(function() {
		removeFromLists($(this).text());
		updateList();
	})
}
updateList();

function removeFromLists(name) {
	friendList.remove(name);
	feedList.remove(name);
	enemyList.remove(name);
}

var $statContainer = $('<div id="stat-container"></div>');
$body.append($statContainer);
$statContainer.css('position','fixed');
$statContainer.css('top', '220px');
$statContainer.css('color', 'white');
$statContainer.css('pointer-events', 'none');

var $massStat = $('<h4 id="mass-stat"></h4>');
$massStat.css('color', 'white');
$statContainer.append($massStat);

var $dodgeStat = $('<h4 id="dodge-stat"></h4>');
$dodgeStat.css('color', 'white');
$statContainer.append($dodgeStat);

var $runCooldown = $('<h4 id="run-cooldown-stat"></h4>');
$runCooldown.css('color', 'white');
$statContainer.append($runCooldown);

var $miscStat = $('<p id="misc-stat"></p>');
$miscStat.css('color', 'white');
$statContainer.append($miscStat);
$miscStat.css('float', 'left');

var behaviorCanvas=$('<div id="behavior-container" style="position:fixed;width:100%;bottom:5px;text-align:center"><h4 id="behavior-char-title">Bot Behavior</h4><canvas id="behavior-canvas" width="250" height="100"></canvas></div>')
$body.append(behaviorCanvas);
$("#behavior-container").css('pointer-events', 'none');

var behaviorCtx=$('#behavior-canvas').get(0).getContext("2d");