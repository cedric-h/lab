//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//tiny helper scripts
const broadcast = require('../broadcast.js');


//ECS exports
module.exports = {
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => 
    {
        //if there are any clients connected
        let models = entities.find('model');

        if(models.length > 0)//if there's at least one model
        {
            let orientations = {};
            models.forEach(entity =>
            {
                let model = entities.getComponent(entity, "model");
                
                //grab the orientation of that model and put it in the object.
                if(model)
                    orientations[entity] = {
                        position:       model.position    .toArray(),
                        quaternion:     model.quaternion  .toArray()
                    }
            });

            //send these orientations to all of the models.
            broadcast('positionUpdate', orientations);
        }
    }
};