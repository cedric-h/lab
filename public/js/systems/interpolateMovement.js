define(['../lib/three.js'], function(THREE)
{
    //helper functions
    function updateMovementData(entity, data)
    {
        let serverId           = entities.getComponent(entity, "serverId");
        let model              = entities.getComponent(entity, "model");
        let movementControls   = entities.getComponent(entity, "movementControls");

        if(typeof model !== "string" && data && !movementControls)
        {
            //model orientation
            model.position  .fromArray(data.position);
            model.quaternion.fromArray(data.quaternion);
            if(data.scale)
                model.scale.fromArray(data.scale);
        }
    }


    //event listeners that handle controls changes from other players
    //handle new position data
    server.on('positionUpdate', positionData =>
    {
        entities.find("serverId").forEach(entity =>
        {
            let data = positionData[entities.getComponent(entity, "serverId")];
            updateMovementData(entity, data);
        });
    });


    //ECS output
    return {
        load: new Promise((resolve, reject) =>
        {
            resolve();
        }),
        update: (entity, delta) => {}
    }
});