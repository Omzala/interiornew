/*
 * Options for the interactive 3D room in the hero. The ids are shared with the
 * scene (src/lib/room/createRoomScene.js), which maps each one to its lighting
 * or fabric preset; labels, icons and swatches here drive the on-page controls.
 */
export const moods = [
  { id: 'dawn', label: 'Dawn', icon: 'M3 18h18M6 18a6 6 0 0 1 12 0M12 6v3M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8' },
  {
    id: 'noon',
    label: 'Noon',
    icon: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  },
  { id: 'dusk', label: 'Dusk', icon: 'M3 17h18M7 17a5 5 0 0 1 10 0M12 4v5M9.5 6.5L12 9l2.5-2.5M6 21h12' },
  { id: 'night', label: 'Night', icon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' },
];

export const palettes = [
  { id: 'ivory', label: 'Ivory bouclé', swatch: '#e8e0d1' },
  { id: 'sage', label: 'Sage linen', swatch: '#a7b098' },
  { id: 'clay', label: 'Clay velvet', swatch: '#c58a6b' },
  { id: 'ink', label: 'Ink & brass', swatch: '#2d333d' },
];

export const defaultMood = 'dusk';
export const defaultPalette = 'ivory';
