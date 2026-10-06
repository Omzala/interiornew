import { useEffect, useRef, useState } from 'react';
import SmartImage from './SmartImage';
import { defaultMood, defaultPalette } from '../data/room';
import '../styles/room3d.css';

const CANVAS_LABEL = 'Interactive 3D living room designed by Anvee Interiors. Drag to look around.';
const FALLBACK_SRC = '/projects/hiya-horizon/img_1469.jpg';
const FALLBACK_ALT = 'Living room with curved seating by Anvee Interiors';

/**
 * The live 3D living room. Fills its positioned parent (position: absolute; inset: 0).
 * three.js is code-split: the scene module is only fetched once this mounts.
 *
 *   mood     'dawn' | 'noon' | 'dusk' | 'night'
 *   palette  'ivory' | 'sage' | 'clay' | 'ink'
 *   view     'overview' | 'inside'
 *   shift    slides the room sideways in the frame (-0.45..0.45, fraction of width)
 *   zoom     1 = the room just fits
 *   play     the room assembles itself once this is true (e.g. after the opening loader)
 *
 * Falls back to a photograph when WebGL is unavailable.
 */
export default function Room3D({
  mood = defaultMood,
  palette = defaultPalette,
  view = 'overview',
  shift = 0,
  zoom = 1,
  play = true,
  className = '',
}) {
  const hostRef = useRef(null);
  const roomRef = useRef(null);
  const optionsRef = useRef({ mood, palette, view, shift, zoom });
  const playRef = useRef(play);
  const [status, setStatus] = useState('loading');
  const [fallbackWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 800 ? 1000 : 1600
  );

  // Forward option changes to the running scene (it eases between them).
  useEffect(() => {
    optionsRef.current = { mood, palette, view, shift, zoom };
    roomRef.current?.update(optionsRef.current);
  }, [mood, palette, view, shift, zoom]);

  useEffect(() => {
    playRef.current = play;
    if (play) roomRef.current?.play();
  }, [play]);

  // Create the scene on a canvas owned by this effect run, so StrictMode's
  // mount → unmount → mount never reuses a canvas whose context was released.
  useEffect(() => {
    const host = hostRef.current;
    let disposed = false;
    let room = null;
    let canvas = null;

    const fail = (err) => {
      if (disposed) return;
      // No WebGL is an expected condition (old devices, disabled GPU); anything else is worth a note.
      if (err?.code !== 'NO_WEBGL') console.warn('Room3D: showing a photo instead of the 3D room.', err);
      room?.dispose();
      room = null;
      roomRef.current = null;
      canvas?.remove();
      canvas = null;
      setStatus('failed');
    };

    import('../lib/room/createRoomScene.js')
      .then(({ createRoomScene }) => {
        if (disposed || !host) return;
        canvas = document.createElement('canvas');
        canvas.className = 'r3d-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', CANVAS_LABEL);
        canvas.dataset.cursor = 'Drag';
        host.prepend(canvas);
        room = createRoomScene(canvas, optionsRef.current);
        roomRef.current = room;
        if (playRef.current) room.play();
        return room.ready.then(() => {
          if (!disposed) setStatus('ready');
        });
      })
      .catch(fail);

    return () => {
      disposed = true;
      roomRef.current = null;
      room?.dispose();
      canvas?.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className={`r3d is-${status}${className ? ` ${className}` : ''}`}>
      {status !== 'failed' && (
        <div className="r3d-loading" aria-hidden="true">
          <span className="r3d-loading-text">Composing the room</span>
          <span className="r3d-loading-line" />
        </div>
      )}
      {status === 'failed' && (
        <div className="r3d-fallback">
          <SmartImage src={FALLBACK_SRC} alt={FALLBACK_ALT} width={fallbackWidth} eager />
          <p className="r3d-note">The 3D room needs WebGL. Showing a photo instead.</p>
        </div>
      )}
    </div>
  );
}
