define(['../lib/three.js'], THREE =>
{
	return {
		load: new Promise((resolve, reject) =>
		{
			resolve();
		}),
		factory: () =>
		{
			return 'player';
		},
		reset: 	 (modelName) =>
		{
			modelName = "player";
		}
	}
});