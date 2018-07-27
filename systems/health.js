//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//tiny helper scripts
const broadcast = require('../broadcast.js');


//variable declaration
var lastBroadcasted = {};


//tell new players how much health everything has
entities.emitter.on("clientCreate", entity =>
{
	let client = entities.getComponent(entity, "client");

    //give them health
    entities.addComponent(entity, "health");
    let health = entities.getComponent(entity, "health");
    health.val = 20;
    health.max = 20;

	client.once('localIdReceived', () =>
    {
        let healthData = {};

        entities.find('health').forEach(entity =>
            healthData[entity] = entities.getComponent(entity, 'health')
        );
        
        client.send('allHealthData', healthData);
    });
});


//ECS exports
module.exports = {
    componentTypesAffected: ["health"],
    searchName: "health",
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => 
    {
        let health = entities.getComponent(entity, "health");

        if(lastBroadcasted[entity] !== health.val)
        {
            broadcast('healthUpdate', {
                serverId: entity,
                val: health.val
            });

            //the .dying flag is to make sure you don't set multiple timeouts to kill the thing.
            if(health.val <= 0 && !health.dying)
            {
                health.dying = true;

                //don't kill the thing immediately because its health depletion animation should
                //finish first, instead wait the length of the animation just in case, then kill it.
                //if we add a dying animation or whatever, we should probably make it the same
                //length just to make this easier.
                setTimeout(
                    () => entities.destroy(entity),
                    6.099999904632568 * 1000 //how long it takes for a health ring to deplete
                );
            }

            lastBroadcasted[entity] = health.val;
        }
    }
};