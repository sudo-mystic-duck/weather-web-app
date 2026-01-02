import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const latStr = url.searchParams.get('lat');
	const lonStr = url.searchParams.get('lon');

	// to make sure that the coords are numbers and only between -90 and 90 for lat and -180 and 180 for lon
	// so that no hacker can input bad bad code grrr
	if (
		!latStr ||
		!lonStr ||
		isNaN(Number(latStr)) ||
		isNaN(Number(lonStr)) ||
		Number(latStr) < -90 ||
		Number(latStr) > 90 ||
		Number(lonStr) < -180 ||
		Number(lonStr) > 180
	) {
		return json({ error: 'Invalid or missing coordinates' }, { status: 400 });
	}

	// we round the coords to 3 decimals so that the user cannot bypass the cache by taking a few steps forward
	const lat = parseFloat(latStr).toFixed(3);
	const lon = parseFloat(lonStr).toFixed(3);

	// if the user reloads the site the same information will be shown for 1 minute
	// or if 2 users at exact the same coords load the site, the server only has to send 1 api call and the other
	// is from the cache
	// this reduces the server load if the user tries to update to fast
	setHeaders({
		'cache-control': 'public, max-age=60'
	});

	const weatherApi = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
	const locationApi = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

	// every millisecond counts so we fetch both apis at the same time
	const [resW, resL] = await Promise.all([
		fetch(weatherApi),

		fetch(locationApi, { headers: { 'User-Agent': 'WeatherApp' } })
	]);

	const weather = await resW.json();

	const location = await resL.json();

	// cuz the api i'm using gives away other names for district depending on your location

	const district: string =
		location.address.suburb || location.address.county || location.address.region || 'Unknown';

	// we need to make sure the frontend gets clean data so we filter it out

	// only the most important data gets to see the light

	return json({
		temp: weather.current_weather.temperature,

		windspeed: weather.current_weather.windspeed,

		winddirection: weather.current_weather.winddirection,

		country: location.address.country || 'Unknown',

		city: location.address.city || location.address.town || location.address.village || 'Unknown',

		district: district
	});
};;
