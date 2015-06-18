function impulseSorter(a, b) {
	//edges take priority
	if (a.threat == 999999) {
		return -1;
	}
	if (b.threat == 999999) {
		return 1;
	}

	//go for closest skittle
	if (a.threat == -1 && b.threat == -1) {
		return a.distance - b.distance;
	}

	//threats before opportunities
	if (a.threat < 0 && b.threat > -1) {
		return 1;
	}
	if (b.threat < 0 && a.threat > -1) {
		return -1;
	}
	//biggest negatives go first
	if (b.threat < 0 && a.threat < 0) {
		return a.threat - b.threat;
	}
	var aWorry = a.worryDistance > a.distance;
	var bWorry = b.worryDistance > b.distance;
	//immediate threats first
	if (aWorry && bWorry) {
		return a.distance - b.distance;
	}
	if (aWorry) {
		return -1;
	}
	if (bWorry) {
		return 1;
	}

	return a.worryDistance - b.worryDistance;
}