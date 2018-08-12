//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//tiny little helper scripts
const broadcast = require('../broadcast.js');
const closestEntity = require('../public/js/util/closestEntity.js');


entities.emitter.on("clientCreate", clientEntity =>
{
	let client = entities.getComponent(clientEntity, "client");

	client.on('interact', () =>
    {
        let playerModel = entities.getComponent(clientEntity, "model");

        let closestInteractableEntity = closestEntity(
            playerModel.position,
            entities.find('interactable').filter(
                entity => entities.getComponent(entity, "model")
            )
        );

        if(closestInteractableEntity !== undefined)
        {
            let interactable = entities.getComponent(closestInteractableEntity, "interactable");
            let model        = entities.getComponent(closestInteractableEntity, "model");
            
            if(playerModel.position.distanceTo(model.position) < interactable.interactionDistance)
                interactable.emitter.emit('interact', clientEntity);
        }
    });
});


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => {}
};