function checkCooldowns(bot) {
	if (bot.attackSplitCooldown > 0) {
		bot.attackSplitCooldown--;
	}
	if (bot.attackSplitWarmup > 0) {
		bot.attackSplitWarmup--;
	}
	if (bot.threatCooldown > 0) {
		bot.threatCooldown--;
	}
}