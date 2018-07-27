//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//tiny helper scripts
const broadcast = require('../broadcast.js');
const closestEntity = require('../public/js/util/closestEntity.js');


const getOrientationData = models =>
{
	let orientations = {};

	models.forEach(entity =>
	{
		let model = entities.getComponent(entity, "model");

		orientations[entity] = {
			position: 	model.position	.toArray(),
			quaternion: model.quaternion.toArray()
		}
	});

	return orientations;
}


//tell new players where enemies are
entities.emitter.on("clientCreate", entity =>
{
	let client = entities.getComponent(entity, "client");

	client.once('loaded', () =>
		client.send("positionUpdate", getOrientationData(entities.find('enemy')))
	);
});


//ECS exports
module.exports = {
    componentTypesAffected: ['model', 'attackable', 'ai'],
    searchName: "enemy",
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => 
    {
    	let model = entities.getComponent(entity, "model");

    	//find the nearest player
    	let nearestPlayer = closestEntity(model.position, entities.find('client'));
    	if(nearestPlayer !== undefined)
    	{
    		let playerModel = entities.getComponent(nearestPlayer, "model");

    		model.rotation.z = Math.atan2(
    			playerModel.position.y - model.position.y,
    			playerModel.position.x - model.position.x
    		);
	    }
    }
};