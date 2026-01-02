<script lang="ts">
    import { onMount } from 'svelte';

    // --- Theme Switcher Logic ---
    let isDark = false;

    function toggleTheme() {
        isDark = !isDark;
        const theme = isDark ? 'dark' : 'light';
        
        // We toggle the 'dark' class for Tailwind and the 'data-theme' for daisyUI
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    let lat: number | null = null;
    let lon: number | null = null;
    let loading = true;
    let permissionDenied = false;
    let error = false;

    // we make an interface so that we just have to define the variables only 1 time and can use them with the weather variable
    interface WeatherData {
        temp: number;
        windspeed: number;
        winddirection: number;
        country: string;
        city: string;
        district: string;
    }

    let weather: WeatherData | null = null;

    async function updateWeather() {
        loading = true;
        error = false;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                // we round the coords to 3 decimals in the frontend to keep the url clean and help the backend with its cache
                lat = parseFloat(pos.coords.latitude.toFixed(3));
                lon = parseFloat(pos.coords.longitude.toFixed(3));

                try {
                    // here we fetch the data from the backend and give it to the weather interface
                    const res = await fetch(`/backend/api?lat=${lat}&lon=${lon}`);
                    if (!res.ok) throw new Error();
                    weather = await res.json();
                } catch (e) {
                    error = true;
                } finally {
                    loading = false;
                }
            },
            () => {
                permissionDenied = true;
                loading = false;
            },
            // why enableHighAccuracy: false you ask? cuz we don't need the exact location and it makes the site faster
            { enableHighAccuracy: false, timeout: 10000 }
        );
    }

    onMount(() => {
        // Load saved theme and apply classes before anything else
        const savedTheme = localStorage.getItem('theme') || 'light';
        isDark = savedTheme === 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (isDark) document.documentElement.classList.add('dark');

        updateWeather();

        // the site updates every 5 minutes so the user doesn't have do it manually
        // and because the weather doesn't change every minute we can do this
        const interval = setInterval(updateWeather, 300000);
        return () => clearInterval(interval);
    });
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 font-sans
            bg-linear-to-br from-[#4facfe] to-[#00f2fe] 
            dark:from-[#1e3c72] dark:to-[#2a5298]">
    
    <h1 class="text-4xl md:text-5xl font-black mb-8 text-center drop-shadow-lg
               text-white dark:text-slate-200 font-['Arial_Black']">
        Weather Web App
    </h1>

    {#if loading}
        <span class="loading loading-spinner loading-lg text-white"></span>
    {:else if permissionDenied}
        <div class="alert alert-warning shadow-lg max-w-md rounded-2xl text-sm">
            <span>Location access denied. Please enable permissions.</span>
        </div>
    {:else if error}
        <div class="alert alert-error shadow-lg max-w-md rounded-2xl text-sm text-white">
            <span>Failed to fetch data.</span>
            <button class="btn btn-sm btn-ghost border-white/20 ml-2" on:click={updateWeather}>Try Reloading</button>
        </div>
    {:else if weather}
        <div class="relative w-80 md:w-96 rounded-[2.5rem] p-8 text-center shadow-2xl
                    bg-linear-to-b from-[#e0fff4] to-[#c2e9fb] 
                    dark:from-[#2c3e50] dark:to-[#3498db]
                    text-slate-800 dark:text-slate-100 transition-all duration-500">
            
            <div class="absolute top-6 right-6">
                <label class="toggle text-base-content shadow-sm">
                    <input 
                        type="checkbox" 
                        checked={isDark} 
                        on:change={toggleTheme} 
                    />
                    <svg aria-label="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="4"></circle>
                            <path d="M12 2v2"></path><path d="M12 20v2"></path>
                            <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
                            <path d="M2 12h2"></path><path d="M20 12h2"></path>
                            <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
                        </g>
                    </svg>
                    <svg aria-label="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor">
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                        </g>
                    </svg>
                </label>
            </div>

            <div class="mt-2">
                <h2 class="text-3xl font-black tracking-tight">{weather.country}</h2>
                <p class="text-lg font-medium opacity-75 mt-1">{weather.city}, {weather.district}</p>
            </div>

            <div class="my-6 h-px bg-slate-900/10 dark:bg-white/20 w-3/4 mx-auto"></div>
            
            <div class="text-7xl font-black my-8 drop-shadow-sm tracking-tighter">
                {weather.temp.toFixed(1)}°C
            </div>
            
            <div class="flex justify-center gap-4 mt-8">
                <div class="bg-white/60 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl shadow-sm flex-1 border border-white/20">
                    <div class="text-[10px] uppercase font-bold opacity-60 mb-1">Windspeed</div>
                    <div class="text-xl font-bold">{weather.windspeed} <span class="text-sm font-normal opacity-80">km/h</span></div>
                </div>
                <div class="bg-white/60 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl shadow-sm flex-1 border border-white/20">
                    <div class="text-[10px] uppercase font-bold opacity-60 mb-1">Direction</div>
                    <div class="text-xl font-bold flex items-center justify-center gap-2">
                        <span class="inline-block" style:transform="rotate({weather.winddirection}deg)">→</span>
                        {weather.winddirection}°
                    </div>
                </div>
            </div>

            <div class="mt-6 text-[10px] uppercase font-mono opacity-40">
                {lat?.toFixed(3)}° N | {lon?.toFixed(3)}° E
            </div>
        </div>
    {/if}
</div>