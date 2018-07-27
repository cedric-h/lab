define(['../lib/three.js'], function(THREE)
{
    //helper functions
    //take a serverId, return the entity with said Id
    function entityWithId(serverId)
    {
        let entityFound = undefined;

        entities.find('serverId').forEach(entity =>
        {
            if(entities.getComponent(entity, "serverId") === serverId)
                entityFound = entity;
        });

        return entityFound;
    }

    function spawn(entityData)
    {
        //create entity, add components
        let entity = entities.create();

        //every entity loaded this way has a serverId, just for commmunication later.
        entities.addComponent(entity, "serverId");
        //programatically add components
        entityData.components.forEach(component =>
            entities.addComponent(entity, component)
        );

        //configure those new components
        Object.keys(entityData.componentOverrides).forEach(component =>
        {
            let override = entityData.componentOverrides[component];
            entities.setComponent(entity, component, override);
        });

        if(entityData.components.indexOf("modelName") !== -1)
        {
            entities.addComponent(entity, "model");

            let model = entities.getComponent(entity, "model");

            ['position', 'quaternion', 'scale'].forEach(orientation =>
            {
                if(entityData[orientation])
                    model[orientation].fromArray(entityData[orientation]);
            });
        }
    }


    entities.emitter.on('loaded', () =>
    {
        Promise.all(
            ['players', 'enemies'].map(modelSource =>
            {
                return new Promise((resolve, reject) =>
                    server.once(modelSource + "ToInstantiate", (entitiesData) =>
                    {
                        entitiesData.forEach(spawn);
                        console.log('done!');
                        resolve();
                    })
                );
            })
        );

        //the id for the client this code is running on.
        server.on('localId',       serverId =>
        {
            let localEntity = entities.find('movementControls')[0];

            entities.addComponent(localEntity, "serverId");
            entities.setComponent(localEntity, "serverId", serverId);

            server.emit('localIdReceived');
        });
    });

    //handle things joining and leaving.
    server.on('entitySpawn',   message  => spawn(message));

    //yeah, fine, leave, whatever. not like I wanted you here anyway. ;o;
    server.on('entityDespawn', serverId => 
    {
        let entity = entityWithId(serverId);
        if(entity)
            entities.destroy(entity);
    });


    //ECS output
    return {
        load: new Promise(resolve => resolve()),
        update: (entity, delta) => {}
    }
});