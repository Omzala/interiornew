import { useState } from 'react';
import { sized } from '../data/projects';

/**
 * Lazy image that fades in once decoded and falls back to an elegant
 * tinted panel if the file can't be loaded.
 */
export default function SmartImage({ src, alt = '', width = 1200, className = '', eager = false, onLoad, style }) {
  const [state, setState] = useState('loading');

  return (
    <span className={`smart-img is-${state} ${className}`} style={style}>
      {state !== 'error' && (
        <img
          src={sized(src, width)}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          onLoad={(e) => {
            setState('loaded');
            onLoad?.(e);
          }}
          onError={() => setState('error')}
        />
      )}
      {state === 'error' && (
        <span className="smart-img-fallback" role="img" aria-label={alt}>
          <span>{alt}</span>
        </span>
      )}
    </span>
  );
}
