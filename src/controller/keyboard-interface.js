function pressW() {
    var oEvent = document.createEvent('KeyboardEvent');
    var k = 87;
    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    Object.defineProperty(oEvent, 'which', {
        get : function() {
            return this.keyCodeVal;
        }
    });

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        console.log("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
    }
    document.dispatchEvent(oEvent);

    var oEvent = document.createEvent('KeyboardEvent');
    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
        get : function() {
            return this.keyCodeVal;
        }
    });
    Object.defineProperty(oEvent, 'which', {
        get : function() {
            return this.keyCodeVal;
        }
    });

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
    } else {
        oEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        console.log("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
    }
    document.dispatchEvent(oEvent);
}
window.pressW = pressW;
document.onkeypress = function(e) {
	if (!keyControls) {
		return;
	}
    e = e || window.event;
    if (e.keyCode == 102) { //f
        for (var i = 0; i<7; i++) {
            setTimeout(pressW, i * 80);
        }
    } else if (e.keyCode == 97) { //a
        window.botEnabled = !window.botEnabled;
    } else if (e.keyCode == 104) { //h
        runOnce = true;
        window.dontShoot = !window.dontShoot;
    } else if (e.keyCode == 100) { //d
	    if (aggressive) {
		    aggressive = false;
	    } else {
		    aggressive = true;
	    }
    } else if (e.keyCode == 103) { //g
	    smartShoot = true;
    } else if (e.keyCode == 115) { //s
	    dontSplit = !dontSplit;
    }
};