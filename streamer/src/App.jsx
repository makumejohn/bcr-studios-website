
    
  
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines, BatteryFull, Check, ChevronRight, CircleUserRound, Clock3, Heart,
  Home, Library, ListMusic, Menu, MonitorPlay, Music2, Pause, Play,
  Search, SkipBack, SkipForward, Signal, SlidersHorizontal, UserRound, Wifi, X,
} from 'lucide-react';

const ARTWORK = [
  '/artwork/cover-forever.svg',
  '/artwork/cover-dreams.svg',
  '/artwork/cover-life.svg',
];
const SAMPLE_TRACKS = [
  { id: 'art-forever', title: 'BCR Forever', artist: 'BCR Studios', artOnly: true },
  { id: 'art-dreams', title: 'Dreams Never Die', artist: 'BCR Studios', artOnly: true },
  { id: 'art-life', title: 'One Life', artist: 'BCR Studios', artOnly: true },
];
const CATEGORY_ITEMS = [
  { label: 'Music', icon: Music2 },
  { label: 'Videos', icon: MonitorPlay },
  { label: 'Favorites', icon: Heart },
  { label: 'Playlists', icon: ListMusic },
];
const NAV_ITEMS = [
  { label: 'Home', icon: Home },
  { label: 'Search', icon: Search },
  { label: 'Library', icon: Library },
  { label: 'Profile', icon: UserRound },
];

function BrandLogo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="BCR Streamer">
      <svg className="brand-crown" viewBox="0 0 80 42" aria-hidden="true">
        <defs>
          <linearGradient id="crown-metal" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#efffff" />
            <stop offset=".36" stopColor="#8ca5b7" />
            <stop offset=".63" stopColor="#ffffff" />
            <stop offset="1" stopColor="#28d6ff" />
          </linearGradient>
        </defs>
        <path d="M9 11 24 24 38 3 51 24 70 9 64 34 17 34Z" fill="none" stroke="url(#crown-metal)" strokeWidth="4" strokeLinejoin="round" />
        <path d="m8 11 16 13 14-21 13 21L70 9" fill="none" stroke="#c8f8ff" strokeWidth="2" />
        <path d="M20 38h42" stroke="#21d5ff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="brand-word">BCR</div>
      <div className="brand-subtitle">STREAMER</div>
    </div>
  );
}

function CoverArt({ index = 0, className = '', title = '', artwork }) {
  const cover = artwork || ARTWORK[((index % ARTWORK.length) + ARTWORK.length) % ARTWORK.length];
  return <img className={`cover-art ${className}`} src={cover} alt={title ? `${title} cover art` : 'BCR music artwork'} loading="lazy" />;
}

function TrackCard({ track, index, onPlay, active, favorite, onFavorite }) {
  return (
    <article className={`track-card ${active ? 'track-card--active' : ''}`}>
      <button className="cover-button" onClick={() => onPlay(track)} aria-label={`Play ${track.title}`}>
        <CoverArt index={index} title={track.title} artwork={track.artwork} />
        <span className="cover-play"><Play size={19} fill="currentColor" /></span>
      </button>
      <div className="track-card-meta">
        <button className="track-title" onClick={() => onPlay(track)}>{track.title}</button>
        <div className="track-artist">{track.artist}</div>
      </div>
      {onFavorite && !track.artOnly && (
        <button className={`tiny-fav ${favorite ? 'tiny-fav--on' : ''}`} onClick={() => onFavorite(track.id)} aria-label={favorite ? 'Remove favorite' : 'Add favorite'}>
          <Heart size={14} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </article>
  );
}

function TrackRow({ track, index, onPlay, active, favorite, onFavorite }) {
  return (
    <div className={`track-row ${active ? 'track-row--active' : ''}`}>
      <button className="row-play" onClick={() => onPlay(track)} aria-label={`Play ${track.title}`}>
        <CoverArt index={index} title={track.title} artwork={track.artwork} />
        <span className="row-play-symbol">{active ? <AudioLines size={17} /> : <Play size={16} fill="currentColor" />}</span>
      </button>
      <button className="row-copy" onClick={() => onPlay(track)}>
        <span className="row-title">{track.title}</span>
        <span className="row-artist">{track.artist}</span>
      </button>
      {onFavorite && !track.artOnly && (
        <button className={`row-icon ${favorite ? 'row-icon--liked' : ''}`} onClick={() => onFavorite(track.id)} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

