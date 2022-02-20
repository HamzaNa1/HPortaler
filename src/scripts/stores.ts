import { writable } from "svelte/store";

export const isLoaded = writable(false);
export const isLoggedIn = writable(false);
export const screenSize = writable({ x: 0, y: 0 });
export const distanceSetting = writable(200);
export const scaleSetting = writable(1);
export const lastPassowrd = window.localStorage.getItem("pass") ?? "";
export const savedDistance = window.localStorage.getItem("distance") ? parseInt(window.localStorage.getItem("distance")) : 200;
export const savedScale = window.localStorage.getItem("scale") ? parseInt(window.localStorage.getItem("scale")) :  100;