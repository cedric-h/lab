define(['../lib/three.js'], function(THREE)
{
	//variable declaration
	//textbox three.js stuff
	const textGeometry = new THREE.PlaneGeometry(6, 3);
	textGeometry.rotateX(Math.PI/2);
	textGeometry.rotateZ(Math.PI/2);
	textGeometry.translate(0, 0, 3.75);
	const textMaterial = new THREE.MeshBasicMaterial({
		side: 			THREE.DoubleSide,
		opacity: 		0.75,
		transparent: 	true,
	});
	//external files
	var propText;



	//helper functions
	function initializeTextbox(entity)
	{
		let model 		= entities.getComponent(entity, "model");
		let textbox 	= entities.getComponent(entity, "textbox");

		let textPlane = new THREE.Mesh(textGeometry, textMaterial.clone());
		textPlane.name = 'textPlane';

		//canvas
		let offscreenCanvas = document.createElement('canvas');
		let ctx = offscreenCanvas.getContext('2d');

		let scale = 0.25;
		offscreenCanvas.width  = scale*6 * 170.66666666666666;
		offscreenCanvas.height = scale*3 * 170.66666666666666;
		ctx.scale(scale, scale);

		//title
		ctx.font         = '116px sans-serif';
		ctx.textBaseline = 'top';
		ctx.lineWidth 	 = 6;
		ctx.fillStyle    = "white";
		ctx.strokeText(textbox.title.toUpperCase(), 0, 0);
		ctx.fillText(  textbox.title.toUpperCase(), 0, 0);

		//line
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(0, 140);
		ctx.lineTo(6 * 200, 140);
		ctx.lineWidth = 10;
		ctx.stroke();
		ctx.lineWidth = 4;
		ctx.strokeStyle = "white";
		ctx.stroke();

		//body text
		ctx.font = '45px sans-serif';
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.lineWidth = 6;
		let inputText = textbox.body;
		let lines = [[]];
		let maxLettersCount = (offscreenCanvas.width - 30) * 1/scale;
		let lettersCount = 0;
		inputText.split(' ').forEach(word =>
		{
			let wordDimensions = ctx.measureText(word + "  ");
		    if(lettersCount + wordDimensions.width > maxLettersCount || word === "\n")
		    {
		        lines.push([]);
		        lettersCount = 0;

		        if(word === "\n")
		        	return;
		    }

		    lettersCount += wordDimensions.width;

		    lines[lines.length - 1].push(word);
		});
		lines.map(line => line.join('  ')).forEach((lineText, index) =>
		{
			ctx.strokeText(lineText, 40, 180 + 55*index);
			ctx.fillText(  lineText, 40, 180 + 55*index);
		});
		

		//applying canvas to plane
		textPlane.material.map = new THREE.CanvasTexture(offscreenCanvas);

		model.add(textPlane);
	}

	//listeners
	entities.emitter.on('textboxCreate', entity =>
	{
		let animation = entities.getComponent(entity, "animation");
		let model     = entities.getComponent(entity, "model");

		if(model)
			initializeTextbox(entity);

		else
			entities.emitter.on('modelCreate', function addAnimationIfRightModel(modelEntity)
			{
				if(entity === modelEntity)
				{
					new Promise(resolve => resolve()).then(() =>
					{
						initializeTextbox(entity);

						entities.emitter.removeListener('modelCreate', addAnimationIfRightModel);
					});
				}
			});
	});

	entities.emitter.once('movementControlsCreate', localPlayerEntity =>
	{
		setInterval(
			() =>
			{
				let playerModel = entities.getComponent(localPlayerEntity, "model");
				let shouldZoom = false;

				entities.find('textbox').forEach(entity =>
				{
					let model   = entities.getComponent(entity, "model");
					let textbox = entities.getComponent(entity, "textbox");
					let textPlane = model.getObjectByName('textPlane');

					let distance = playerModel.position.distanceTo(model.position);

					if(distance < textbox.appearDistance)
					{
						textPlane.visible = true;

						if(distance < textbox.zoomDistance)
							shouldZoom = true;
					}

					else
						textPlane.visible = false;
				});

				let cameraControls = entities.getComponent(localPlayerEntity, "cameraControls");

				cameraControls.offset.z = shouldZoom ? 3.35 : cameraControls.default.offset.z;
				cameraControls.radius   = shouldZoom ? 3    : cameraControls.default.radius;
			},
			250
		);
	});


	//ECS output
	return {
		load: new Promise((resolve, reject) => resolve()), 
		update: (entity, delta) => {}
	}
});