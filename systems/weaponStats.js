//three.js
const THREE = require('three');

//file system
const fs = require('fs-extra');

//events
const EventEmitter = require('events');


//variable declaration
var weaponStats;
var loadingEmitter = new EventEmitter();


//apply stats to newly created weapons
entities.emitter.on('weaponEquip', entity =>
{
	let weapon = entities.getComponent(entity, "weapon");

	if(weaponStats !== undefined)
		Object.assign(weapon, weaponStats[weapon.name]);

	else
		loadingEmitter.once('loaded', () =>
			Object.assign(weapon, weaponStats[weapon.name])
		);
});

module.exports = {
	load: new Promise(resolve => {
		fs.readFile('./public/gamedata/weapons.json').then(data =>
		{
			weaponStats = JSON.parse(data);
			resolve();

			loadingEmitter.emit('loaded');
		});
	}),
	update: (entity, delta) => {}
}