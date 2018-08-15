define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	var weaponStats = {};
	var weaponAdjustments = [];


	//helper functions
	function adjustForOwner(wielderEntity)
	{
		let weapon 	         = entities.getComponent(wielderEntity, "weapon");
		let wielderModelName = entities.getComponent(wielderEntity, "modelName") || "player";

		weaponAdjustments.forEach(adjustment =>
		{
			let wielders = adjustment.wielders;
			let weapons  = adjustment.weapons;

			if(
				(!weapons  || weapons.length === 0  || weapons.indexOf(weapon.name) 	  !== -1) &&
				(!wielders || wielders.length === 0 || wielders.indexOf(wielderModelName) !== -1)
			)
			{
				if(adjustment.rotation)
					weapon.adjustments.rotation = new THREE.Quaternion().setFromEuler(
						new THREE.Euler().fromArray(adjustment.rotation)
					);

				if(adjustment.position)
					weapon.adjustments.position = new THREE.Vector3().fromArray(
						adjustment.position
					);
			}
		});

		entities.emitter.emit('weaponStatsAssigned', wielderEntity);
	}


	//assign that listener
	entities.emitter.on('weaponEquip', entity =>
	{
		let weapon = entities.getComponent(entity, "weapon");

		Object.assign(weapon, JSON.parse(JSON.stringify(weaponStats[weapon.name])));


		//let the weapon get assigned
		new Promise(resolve => resolve()).then(() =>
		{
			adjustForOwner(entity);
		});
	});
	

	//ECS output
	return {
		load: new Promise((resolve, reject) =>
		{
			var loader = new THREE.FileLoader();

			Promise.all([
				new Promise((resolve) =>
					loader.load(
						'./gamedata/weapons.json',
						(content) =>
						{
							weaponStats = JSON.parse(content);

							resolve();
						}
					)
				),
				new Promise((resolve) =>
					loader.load(
						'./gamedata/weaponPositionAdjustments.json',
						(content) =>
						{
							weaponAdjustments = JSON.parse(content);

							resolve();
						}
					)
				)
			]).then(resolve);
		}),
		update: (entity, delta) =>
		{
		}
	}
});