Ai.prototype = {
	impulses: [],
	safeSplit: true,
	threatened: false,
	opportunity: false,
	immediateThreats: false,
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	maxThreatCooldown: 40,
	defenseSplitCooldown: 0,
	attackSplitCooldown: 0,
	attackTarget: null,
	closestVirus: null,
	runCooldown: 0,
	smartShootCount: 0,
	shotLastCooldown: false,
	immediateThreatCooldown: 0,
	currentState: '',
	organismState: {},
	myOrganism: {},
	moveCoords: {},
	onDraw: this.draw,
	onMove: this.move,
	onTick: this.tick,
	onSplit: this.split,
	onShoot: this.shoot,
	move:function(x,y){}, //overwrite these in main_out.js
	split:function(){},
	shoot:function(){},
	possibleImpulses:[
		{
			value: 1,
			label: 'Running',
			color: '#0000FF'
		},
		{
			value: 1,
			label: 'Skittle',
			color: '#00FF00'
		},
		{
			value: 1,
			label: 'Immediate',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Consume Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Split Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Virus Threat',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Left Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Top Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Right Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Bottom Edge',
			color: '#FF0000'
		},
		{
			value: 1,
			label: 'Split Eat',
			color: '#00FF00'
		},
		{
			value: 1,
			label: 'Consume Eat',
			color: '#00FF00'
		}
	],