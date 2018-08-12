const THREE = require('three');
const EventEmitter = require('events');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: () =>
	{
		return {
			//ranged
			projectileCount: 0,
			readied: 		 false,
			readying: 		 false,
			readiedPosition: new THREE.Vector3(),

			//melee
			withinRange: 	 false,
			lastAttackDate:  undefined,
			isSwinging: 	 false,

			//both
			target: 		 undefined,
			attackOn: 		 false,
			emitter: 		 new EventEmitter()
		}
	},
	reset: combat =>
	{
		combat.target	 = undefined;
		combat.attackOn  = false;

		combat.emitter.removeAllListeners();
	}
};