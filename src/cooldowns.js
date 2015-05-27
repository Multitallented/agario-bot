function checkCooldowns() {
	if (attackSplitCooldown > 0) {
		attackSplitCooldown--;
	}
	if (attackSplitWarmup > 0) {
		attackSplitWarmup--;
	}
	if (threatCooldown > 0) {
		threatCooldown--;
	}
}