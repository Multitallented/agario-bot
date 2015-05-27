var runOnce = true;
var pressingButton = window.pressingButton = false;
var attackSplitCooldown = 0;
var attackSplitWarmup = -1;
var threatCooldown = 0;
var lastEscapeVector = 0;
var lastImpulse = "";
var closestEnemy = 999999;
var closestEnemySize = 10;
var closestEnemyName = "";
var lastSize = 10;
var lastLog = 101;

//Christmas Tree initializer
var otherOrganisms = [];
var viruses = 		[  ];
var enemies =      [    ];
var skittles =    [      ];
var impulses =   [        ];
var afkMass =        [];