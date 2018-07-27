define(['../lib/three.js'], (THREE) =>
{
	return {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return {
				//data
				radius: 			6,
				offset: 			new THREE.Vector3(//from the position this entity also has.
					0,
					0,
					2
				),
				rotations: 			new THREE.Vector2(//longitude and latitude on the sphere around the player
					(Math.PI*2),
					(Math.PI*2)*0.2
				),
				quaternion: 		new THREE.Quaternion(),//rotation on z axis, nice for animating
				sensitivity: 		new THREE.Vector2(
					(Math.PI*2)/4000,
					(Math.PI*2)/10000
				),
				mouseControlled: 	false,
				entity: 			undefined
			}
		}
	}
});