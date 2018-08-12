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
			emitter: new EventEmitter()
		}
	}
};