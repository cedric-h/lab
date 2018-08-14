define(['../lib/three.js', '../util/closestEntity.js'], function(THREE, closestEntity)
{
	//variable declaration
	const spaceBetweenSpells = (Math.PI*2)/12;
	const slotGeometry = new THREE.PlaneGeometry(0.48, 0.48);
	slotGeometry.translate(-1.32, 0, 0.08)


	//helper functions
	function addAttacksBar(playerEntity)
	{
		let weapon = entities.getComponent(playerEntity, 'weapon');
		let model  = entities.getComponent(playerEntity, 'model');

		let textureLoader = new THREE.TextureLoader();

		let attacksBar = new THREE.Group();

		Promise.all(
			weapon.attacks.map((attack, index) => new Promise(resolve =>
				{
					textureLoader.load(
						'./assets/textures/' + attack.image,
						texture =>
						{
							let slotMesh = new THREE.Mesh(
								slotGeometry,
								new THREE.MeshBasicMaterial({
									map: texture,
									transparent: true,
									opacity: 0.15
								})
							);
							slotMesh.name = index;
							slotMesh.rotation.z += spaceBetweenSpells * index;

							attack.ui = {
								initialized: true,
								ready: true,

								opacity: {
									ready: {
										max: 1,
										min: 0.77,
										changeSpeed: 0.5,
									},
									chargingUp: {
										max: 0.4,
										min: 0.1,
										changeSpeed: 1,
									},
									fadingDown: true
								}
							}

							attacksBar.add(slotMesh);

							resolve();
						}
					);
				}
			))
		).then(() =>
		{
			attacksBar.rotation.z -= spaceBetweenSpells*(weapon.attacks.length - 1)/2;
			attacksBar.name = "attacksBar";
			model.add(attacksBar);
		});
	}


	//event listeners
	entities.emitter.on('movementControlsCreate', entity =>
	{
		entities.emitter.on('weaponStatsAssigned', function waitUntilStats(weaponEntity)
		{
			if(weaponEntity === entity)
			{
				addAttacksBar(entity)
				entities.emitter.removeListener('weaponStatsAssigned', waitUntilStats);
			}
		})
	});

	server.on('attackBarUpdate', uiData =>
	{
		let playerEntity = entities.find('movementControls')[0];
		let weapon = entities.getComponent(playerEntity, 'weapon');

		weapon.attacks[uiData.slotIndex].ui.ready = uiData.ready;

		if(uiData.readyAgainAfter)
			setTimeout(
				() => weapon.attacks[uiData.slotIndex].ui.ready = true,
				uiData.readyAgainAfter
			);
	});


	//ECS output
	return {
		componentTypesAffected: ['weapon', 'movementControls'],
		searchName: ['weaponUI'],
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}), 
		update: (entity, delta) =>
		{
			let weapon 		= entities.getComponent(entity, 'weapon');
			let playerModel = entities.getComponent(entity, 'model');

			let attacksBarModel = playerModel.getObjectByName('attacksBar');

			if(attacksBarModel)
				weapon.attacks.forEach((attack, index) =>
				{
					let ui = attack.ui;
					let model = attacksBarModel.getObjectByName(index);

					//opacity
					let opacity = attack.ui.opacity;
					let opacityState = opacity[ui.ready ? 'ready' : 'chargingUp'];

					//clamp opacity
					model.material.opacity = Math.max(model.material.opacity, opacityState.min);
					model.material.opacity = Math.min(model.material.opacity, opacityState.max);

					if(opacity.fadingDown)
					{
						model.material.opacity -= opacityState.changeSpeed * delta;

						if(model.material.opacity <= opacityState.min)
							opacity.fadingDown = false;
					}

					else
					{
						model.material.opacity += opacityState.changeSpeed * delta;

						if(model.material.opacity >= opacityState.max)
							opacity.fadingDown = true;
					}
				});
		}
	}
});