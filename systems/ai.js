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
        let model  = entities.getComponent(entity, "model");
        let combat = entities.getComponent(entity, "combat");
    	let ai     = entities.getComponent(entity, "ai");


        //find out who we'll be attacking
        if(combat.target !== undefined)
        {
            let targetModel = entities.getComponent(combat.target, "model");

            //look at 'em
    		model.rotation.z = Math.atan2(
    			targetModel.position.y - model.position.y,
    			targetModel.position.x - model.position.x
    		);

            //we have a target, so shoot if the timer is spent
            if(ai.attackTimer === undefined || ai.attackTimer - Date.now() < 0)
            {
                ai.attackTimer = Date.now() + ai.attackCooldown;

                combat.emitter.emit('launchAttack', {});
            }
	    }

        else
        {
            let closestPlayer = closestEntity(
                model.position,
                entities.find('client').filter(
                    entity => entities.getComponent(entity, "model")
                )
            );

            if(closestPlayer !== undefined)
                combat.emitter.emit('newTarget', closestPlayer);
        }
    }
};