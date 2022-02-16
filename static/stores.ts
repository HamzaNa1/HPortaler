import { writable } from "svelte/store";

export const isLoaded = writable(false);
export const isLoggedIn = writable(false);
export const screenSize = writable({ x: 0, y: 0 });