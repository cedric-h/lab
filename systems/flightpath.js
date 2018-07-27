//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//tiny helper scripts
const broadcast = require('../broadcast.js');

//three.js
const THREE = require('three');


//ECS exports
module.exports = {
    componentTypesAffected: ['flightpath'],
    searchName: 'flightpath',
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => 
    {
        let flightpath   = entities.getComponent(entity, "flightpath");
        let model        = entities.getComponent(entity, "model");

        if(flightpath.totalTime === 0)
        {
            let distance = flightpath.start.distanceTo(flightpath.end);
            flightpath.totalTime = distance/flightpath.speed;
            flightpath.height    = distance/12;
        }

        flightpath.time += delta;
        let progress = flightpath.time/flightpath.totalTime;

        if(progress < 1)
            model.position.lerpVectors(
                flightpath.start,
                flightpath.end,
                progress
            );

        else
        {
            broadcast('entityDespawn', entity);
            entities.destroy(entity);
        }
    }
}