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
				title: 				'...',
				body: 				'hi there! I',
				appearDistance: 	5,
				zoomDistance:       0.5
			}
		},
		reset: animation =>
		{
			delete animation.mixer;
			animation.initialized = false;
		}
	}
});