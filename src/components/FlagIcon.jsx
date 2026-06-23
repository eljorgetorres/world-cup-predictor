import { FLAG_ISO } from '../utils/flagMap.js';

export default function FlagIcon({ teamId, className = '' }) {
  const iso = FLAG_ISO[teamId];
  if (!iso) return null;
  return <span className={`fi fi-${iso}${className ? ` ${className}` : ''}`} aria-hidden="true" />;
}
