//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');


//variable declaration



//spawn enemies on switch pull
entities.emitter.on('interactableCreate', syringeEntity =>
{
    let modelName = entities.getComponent(syringeEntity, "modelName")

    if(modelName === "syringe")
    {
        let interactable = entities.getComponent(syringeEntity, "interactable");

        interactable.emitter.on('interact', interacterEntity =>
        {
            if(entities.find('ai').length === 0)
            {
                let interacterHealth = entities.getComponent(interacterEntity, "health");

                setTimeout(
                    () =>
                        interacterHealth.val = interacterHealth.max,
                    1000
                );

                broadcast('interaction', syringeEntity);
            }
        });
    }
});


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) => resolve()),
    update: (entity, delta) => {}
};