function makeFriends(organismState) {
	for (var i=0; i<organismState.enemies.length; i++) {
		var currentPotentialFriend = organismState.enemies[i];
		if (currentPotentialFriend.name &&
				enemyList.indexOf(currentPotentialFriend.name) == -1 &&
				feedList.indexOf(currentPotentialFriend.name) == -1 &&
				friendList.indexOf(currentPotentialFriend.name) == -1 &&
				(currentPotentialFriend.name.indexOf('friend') > -1 ||
				currentPotentialFriend.name.indexOf('team') > -1)) {
			friendList.push(currentPotentialFriend.name);
			updateList();
		}
	}
}