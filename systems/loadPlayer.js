//ECSbus
var ECSbus 	 = require('../ECSbus');
let ecs 	 = ECSbus.ecs;
let entities = ECSbus.entities;

//file system
const fs = require('fs-extra');


//make space for the things they'll later load
const ecsFiles    = {};
const meshLocations = [];


//listening for a new player to join so you can give them stuff to load
entities.emitter.on('clientCreate', clientEntity =>
{
	let client = entities.getComponent(clientEntity, 'client');

	//helpful logging
    console.log('client connected');

    //then just tell the client where stuff is so that they can load it.
    client.on('loadingECS', () =>
        client.send('ecsFiles', ecsFiles)
    );

    //tell the player where the models they need to load are
    client.on('loading', () =>
        client.send('meshLocations', meshLocations)
    );
})


//ECS exports
module.exports = {
	componentTypesAffected: ["client"],
	load: new Promise((resolve, reject) =>
	{
        //get the names of the files that the clients will need to load.
        ecsFiles.components = fs.readdirSync('./public/js/components').map(x => './js/components/' + x);
        ecsFiles.systems    = fs.readdirSync('./public/js/systems'   ).map(x => './js/systems/'    + x);


        //grab the relevant file paths for the 3D models
        meshLocations.push(...[
            ].concat(...[            //names of the folders to scan
                    'models',
                    'scenes',
                    'collisionMaps',
                    'weapons'
                ].map(folder =>
                    fs.readdirSync(  //get the names of the files inside of those folders
                        './public/assets/' + folder + '/'
                    ).map(x =>       //turn those into filepaths relative to the client directory
                        './assets/' + folder + '/' + x
                    )
                )
            ).map(fileName =>        //split
                fileName.split('.')
            ).filter(parts =>        //filter out the assets that aren't .jsons, because
                parts[parts.length - 1] === "json" //those contain links to the other types.
            ).map(parts =>           //join it all back together but leave out the file type
                parts.splice(0, parts.length - 1).join('.')
            )
        );

        
        //return
		resolve();
	}),
	update: (entity, delta) =>
	{
	}
}