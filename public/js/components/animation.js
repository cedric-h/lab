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
				mixer: 		 undefined,
				initialized: false,
				active: 	 true
			}
		},
		reset: animation =>
		{
			delete animation.mixer;
			animation.initialized = false;
		}
	}
});