Bot.prototype = {
	impulses: [],
	safeSplit: true,
	threatened: false,
	lastStateChangeDate:null,
	gameHistory:[],
	scoreHistory:[],
	maxThreatCooldown: 40,
	threatEscapeVectors: [],
	attackSplitCooldown: 0,
	attackSplitWarmup: -1,
	threatCooldown: 0,
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