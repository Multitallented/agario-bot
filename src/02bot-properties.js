Bot.prototype = {
	impulses: [],
	largestSelf: 10,
	totalSize: 10,
	lastStateChangeDate:null,
	runOnce: true,
	gameHistory:[],
	scoreHistory:[],
	dodgeDistance: 200,
	maxThreatCooldown: 40,
	otherOrganisms: [],
	threatEscapeVectors: [],
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