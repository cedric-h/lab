const THREE = require('three');
const EventEmitter = require('events');

module.exports = {
	load: new Promise((resolve, reject) =>
	{
		resolve();
	}),
	factory: function createPosition()
	{
		return {
			target: 		 undefined,
			active: 		 false,
			projectileCount: 0,
			emitter: 		 new EventEmitter()
		}
	}
};