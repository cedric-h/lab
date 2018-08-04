/*
	We need some cool filler text
	right here, with like a studio name
	and maybe a Copyright 2018
*/


//lib includes

//ECS lib classes
const EntityComponentSystem = require("entity-component-system").EntityComponentSystem;
const EntityPool = require("entity-component-system").EntityPool;

//file system
const fs = require('fs-extra');

//in this part of the program literally just for the clock
const THREE = require('three');

//server and client module that loads external ECS files
const loadECS = require('./public/js/loadECS');

//ECSbus shares these ECS variables with all of the code base.
const ECSbus = require('./ECSbus');
let ecs 	 = ECSbus.ecs;
let entities = ECSbus.entities;

entities.emitter.setMaxListeners(150);


//error handling
process.on('unhandledRejection', err =>
{
	console.error(err);
});

let directoriesToGet = [
	'./systems',
	'./components',
	'./public/js/systems',
	'./public/js/components'
]

//ECS loading
Promise.all(directoriesToGet.map(x => fs.readdir(x))).then((folders) =>
{
	folders.forEach((folder, folderIndex) =>
	{
		folder.forEach((fileName, fileIndex) =>
		{
			//use a try/catch to handle the module if it's not server compatible.
			try
			{
				//console.log(directoriesToGet[folderIndex] + '/' + fileName);
				folder[fileIndex] = require(directoriesToGet[folderIndex] + '/' + fileName);
				folder[fileIndex].name = fileName.split('.')[0];

				if(folder[fileIndex].serverAndClient)
					folders[folderIndex - 2].push(folder[fileIndex]);
			}

			catch(error)
			{
				//if the cause of the error was simply that the module in question wasn't server compatible,
				//log that and move on.
				if(error.name === "ReferenceError" && error.message === "define is not defined")
					{}//do literally nothing, this file wasn't designed for the server.

				//however, if it was a legitimate error in a file was designed to run on the server,
				//throw the error so that it pops up in the console, that way it can be debugged.
				else
					throw error;
			}
		});
	})

	//passing it to loadECS
	loadECS(
		folders[0], //systems
		folders[1], //components
	).then(afterECSLoad);
});


//once the ./components and ./systems files are loaded, fire up the update loop.
function afterECSLoad()
{
	//update loop
	let clock = new THREE.Clock();

	var update = () =>
	{
		let delta = clock.getDelta();

		ecs.run(entities, delta);

		setTimeout(update, 1000/30);
	};
	update();
}