import { COLORS } from "./constants.js";

export function createSettingsIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><path d="M0,0h24v24H0V0z" fill="none"/><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></g></svg>`;
  return svg;
}

export function createPushPinIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><path d="M16,9V4l1,0c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H7C6.45,2,6,2.45,6,3v0 c0,0.55,0.45,1,1,1l1,0v5c0,1.66-1.34,3-3,3h0v2h5.97v7l1,1l1-1v-7H19v-2h0C17.34,12,16,10.66,16,9z" fill-rule="evenodd"/></g></svg>`;
  return svg;
}

export function createRefreshIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
  return svg;
}

export function creatChevronLeftIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
  return svg;
}

export function createChevronRightIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
  return svg;
}

export function createPanToolIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M23,5.5V20c0,2.2-1.8,4-4,4h-7.3c-1.08,0-2.1-0.43-2.85-1.19L1,14.83c0,0,1.26-1.23,1.3-1.25 c0.22-0.19,0.49-0.29,0.79-0.29c0.22,0,0.42,0.06,0.6,0.16C3.73,13.46,8,15.91,8,15.91V4c0-0.83,0.67-1.5,1.5-1.5S11,3.17,11,4v7 h1V1.5C12,0.67,12.67,0,13.5,0S15,0.67,15,1.5V11h1V2.5C16,1.67,16.67,1,17.5,1S19,1.67,19,2.5V11h1V5.5C20,4.67,20.67,4,21.5,4 S23,4.67,23,5.5z"/></g></g></g></svg>`;
  return svg;
}

export function createArrowFlightIconSvg(color = COLORS.BLACK) {
  const svg = `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="M182.938 17.75l-29.625 112-64.22-64.313-18.218 18.22L480.78 494.124h11.814V469.5L264.72 241.28l29.624-112.124-17.53-17.53-16.783 37.468-.31-54.563-23.564-23.56-12.125 19.75-2.343-34.22-38.75-38.75zM419.875 81l-17.563 66.47-35.406-35.407-14.875 15.156 140.564 140.593V237.75l-20.375-20.375 17.592-66.438L419.875 81zM114.72 154l-92.814 24.53 16.75 16.75 50.97-1-37.19 14.782 39.44 39.438 32.905 2.03-12.874 8.907 20.688 1.282-16.844 11.655 17.594 17.594L226 265.436 114.72 154zm252.936 15.28l-48.97 12.94 25.658 25.655 31.875 2.156-18.408 11.314 30.782 30.78 48.97-12.936-69.908-69.907zM122.78 316.313l-17.56 66.407-35.345-35.47-15.313 15.313 131.594 131.562h30.094l-41.156-41.313 17.594-66.593-13.907-13.908-12.093 19.782-2.343-34.22-41.563-41.562zm188.907 51.594l-10.843 41.063-23.5-23.5-13.22 13.217 23.376 23.344-40.72 10.783 44.814 44.812 40.72-10.78 27.998 28h26.407l-41.095-41.095 10.844-41.03-19.158-19.19-8.562 7.75-3.344-19.624-13.72-13.75zM70.25 404.656L21.562 417.5l54 54h34.094L93.126 487l47.03-12.438-69.906-69.906z"/></svg>`;
  return svg;
}

export function createBallPileIconSvg(color = COLORS.BLACK) {
  const svg = `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 12.0001C11 13.1046 10.1046 14.0001 9 14.0001C7.89543 14.0001 7 13.1046 7 12.0001C7 10.8955 7.89543 10.0001 9 10.0001C10.1046 10.0001 11 10.8955 11 12.0001Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17 12.0001C17 13.1046 16.1046 14.0001 15 14.0001C13.8954 14.0001 13 13.1046 13 12.0001C13 10.8955 13.8954 10.0001 15 10.0001C16.1046 10.0001 17 10.8955 17 12.0001Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14 6.81006C14 7.91463 13.1046 8.81006 12 8.81006C10.8954 8.81006 10 7.91463 10 6.81006C10 5.70549 10.8954 4.81006 12 4.81006C13.1046 4.81006 14 5.70549 14 6.81006Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 17.1901C8 18.2946 7.10457 19.1901 6 19.1901C4.89543 19.1901 4 18.2946 4 17.1901C4 16.0855 4.89543 15.1901 6 15.1901C7.10457 15.1901 8 16.0855 8 17.1901Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14 17.1901C14 18.2946 13.1046 19.1901 12 19.1901C10.8954 19.1901 10 18.2946 10 17.1901C10 16.0855 10.8954 15.1901 12 15.1901C13.1046 15.1901 14 16.0855 14 17.1901Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20 17.1901C20 18.2946 19.1046 19.1901 18 19.1901C16.8954 19.1901 16 18.2946 16 17.1901C16 16.0855 16.8954 15.1901 18 15.1901C19.1046 15.1901 20 16.0855 20 17.1901Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  return svg;
}

export function createBaseballIconSvg(color = COLORS.BLACK) {
  const svg = `<?xml version="1.0" encoding="utf-8"?>
<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="800px" height="800px" viewBox="0 -0.5 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-baseball-stick">
    
    <title>879</title>
    
    <defs>

</defs>
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M3.291,15.114 L3.016,14.837 C6.416,10.782 10.014,9.208 12.914,6.673 C15.865,4.094 16.016,3.788 16.364,3.439 C17.186,2.617 17.234,1.334 16.473,0.572 C15.71,-0.191 14.426,-0.143 13.604,0.679 C13.255,1.027 12.949,1.179 10.371,4.129 C7.836,7.03 5.914,10.614 2.186,14.01 L1.91,13.733 C1.774,13.597 1.479,13.673 1.25,13.902 C1.021,14.131 0.945,14.425 1.082,14.562 L2.464,15.943 C2.6,16.08 2.895,16.004 3.124,15.775 C3.352,15.546 3.429,15.251 3.291,15.114 L3.291,15.114 Z" fill="${color}" class="si-glyph-fill">

</path>
    </g>
</svg>`;
  return svg;
}

export function createCompressIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M0 0h24v24H0V0z" fill="none"/><path d="M8 19h3v3h2v-3h3l-4-4-4 4zm8-15h-3V1h-2v3H8l4 4 4-4zM4 9v2h16V9H4z"/><path d="M4 12h16v2H4z"/></svg>`;
  return svg;
}

export function createRecordVoiceIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><circle cx="9" cy="9" r="4"/><path d="M9 15c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7.76-9.64l-1.68 1.69c.84 1.18.84 2.71 0 3.89l1.68 1.69c2.02-2.02 2.02-5.07 0-7.27zM20.07 2l-1.63 1.63c2.77 3.02 2.77 7.56 0 10.74L20.07 16c3.9-3.89 3.91-9.95 0-14z"/></svg>`;
  return svg;
}

export function createSportsMmaIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M7,20c0,0.55,0.45,1,1,1h8c0.55,0,1-0.45,1-1v-3H7V20z"/><path d="M18,7c-0.55,0-1,0.45-1,1V5c0-1.1-0.9-2-2-2H7C5.9,3,5,3.9,5,5v5.8c0,0.13,0.01,0.26,0.04,0.39l0.8,4 c0.09,0.47,0.5,0.8,0.98,0.8h10.36c0.45,0,0.89-0.36,0.98-0.8l0.8-4C18.99,11.06,19,10.93,19,10.8V8C19,7.45,18.55,7,18,7z M15,10 H7V7h8V10z"/></g></g></svg>`;
  return svg;
}

export function createFireIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M12,12.9l-2.13,2.09C9.31,15.55,9,16.28,9,17.06C9,18.68,10.35,20,12,20s3-1.32,3-2.94c0-0.78-0.31-1.52-0.87-2.07 L12,12.9z"/></g><g><path d="M16,6l-0.44,0.55C14.38,8.02,12,7.19,12,5.3V2c0,0-8,4-8,11c0,2.92,1.56,5.47,3.89,6.86C7.33,19.07,7,18.1,7,17.06 c0-1.32,0.52-2.56,1.47-3.5L12,10.1l3.53,3.47c0.95,0.93,1.47,2.17,1.47,3.5c0,1.02-0.31,1.96-0.85,2.75 c1.89-1.15,3.29-3.06,3.71-5.3C20.52,10.97,18.79,7.62,16,6z"/></g></g></g></svg>`;
  return svg;
}

export function createCloseIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  return svg;
}

export function createFreezeIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z"/></svg>`;
  return svg;
}

export function createSawIconSvg(color = COLORS.BLACK) {
  const svg = `  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><rect fill="none" height="24" width="24"/><path d="M19.73,14.23L7,1.5L3.11,5.39l8.13,11.67c-0.78,0.78-0.78,2.05,0,2.83l1.41,1.41c0.78,0.78,2.05,0.78,2.83,0l4.24-4.24 C20.51,16.28,20.51,15.01,19.73,14.23z M14.07,19.88l-1.41-1.41l4.24-4.24l1.41,1.41L14.07,19.88z"/></svg>`;
  return svg;
}

export function createSportsMartialArtsIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><rect fill="none" height="24" width="24"/></g><g><g><polygon points="19.8,2 11.6,8.7 10.39,7.66 13.99,5.58 9.41,1 8,2.41 10.74,5.15 5,8.46 3.81,12.75 6.27,17 8,16 5.97,12.48 6.32,11.18 9.5,13 10,22 12,22 12.5,12 21,3.4"/><circle cx="5" cy="5" r="2"/></g></g></svg>`;
  return svg;
}

export function createBoltIconSvg(color = COLORS.BLACK) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>`;
  return svg;
}
