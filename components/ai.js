const THREE = require('three');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: function createPosition()
	{
		return {
			attackTimer: 	undefined,
			attackCooldown: 3000
		}
	}
};