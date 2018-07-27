//ECSbus
var ECSbus   = require('../ECSbus');
let ecs      = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');

//broadcast
const broadcast = require('../broadcast.js');


//host.js hosts the site and accepts a handler for when a new player joins.
require('../host.js')((ws) =>
{
    //make the new player
    let newPlayer = entities.create();
    entities.addComponent(newPlayer, 'client');

    //now let's initialize that client we just added
    let client = entities.getComponent(newPlayer, 'client');
    client.initialize(ws);

    client.once('loaded', () =>
    {
        //tell everyone but the new player that a player joined.
        entities.find("client").forEach(entity =>
        {
            if(entity !== newPlayer)
                entities.getComponent(entity, "client").send('playerJoin', {
                    serverId: newPlayer
                });
        });

        //tell the new player what the server thinks their id is,
        //so they can pull their information out of packages the server
        //sends them.
        client.send('localId', newPlayer);
    });

    client.ws.once('close', () =>
    {
        entities.destroy(newPlayer);
        broadcast('playerLeave', entities.find('client').length);
    });
});

//ECS exports
module.exports = {
    componentTypesAffected: [],
    load: new Promise((resolve, reject) =>
    {
        resolve();
    }),
    update: (entity, delta) => {}
};