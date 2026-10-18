import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines, BatteryFull, Check, ChevronRight, CircleUserRound, Clock3, Heart,
  Home, Library, ListMusic, LockKeyhole, LogOut, Menu, Mic2, MonitorPlay,
  Music2, Pause, Play, Plus, Search, ShieldCheck, SkipBack, SkipForward,
  Signal, SlidersHorizontal, Trash2, UploadCloud, UserRound, Wifi, X,
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

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

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

function CoverArt({ index = 0, className = '', title = '' }) {
  const cover = ARTWORK[((index % ARTWORK.length) + ARTWORK.length) % ARTWORK.length];
  return <img className={`cover-art ${className}`} src={cover} alt={title ? `${title} cover art` : 'BCR music artwork'} loading="lazy" />;
}

function TrackCard({ track, index, onPlay, active, favorite, onFavorite }) {
  return (
    <article className={`track-card ${active ? 'track-card--active' : ''}`}>
      <button className="cover-button" onClick={() => onPlay(track)} aria-label={`Play ${track.title}`}>
        <CoverArt index={index} title={track.title} />
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

function TrackRow({ track, index, onPlay, active, favorite, onFavorite, onDelete, showDelete = false }) {
  return (
    <div className={`track-row ${active ? 'track-row--active' : ''}`}>
      <button className="row-play" onClick={() => onPlay(track)} aria-label={`Play ${track.title}`}>
        <CoverArt index={index} title={track.title} />
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
      {showDelete && onDelete && (
        <button className="row-icon row-icon--delete" onClick={() => onDelete(track.id)} aria-label={`Delete ${track.title}`}>
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [activeCategory, setActiveCategory] = useState('Music');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bcr-favorites') || '[]')); }
    catch { return new Set(); }
  });
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  const loadTracks = useCallback(async () => {
    try {
      const response = await fetch('/api/tracks', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load songs');
      const data = await response.json();
      setTracks(Array.isArray(data) ? data : []);
    } catch {
      setTracks([]);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);
  useEffect(() => {
    try { localStorage.setItem('bcr-favorites', JSON.stringify([...favorites])); } catch { /* local storage is optional */ }
  }, [favorites]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!activeTrack?.url) {
      audio.pause();
      audio.removeAttribute('src');
      setIsPlaying(false);
      setElapsed(0);
      setDuration(0);
      return;
    }
    audio.src = activeTrack.url;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [activeTrack?.id]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  const visibleTracks = useMemo(() => {
    let list = tracks;
    if (activeCategory === 'Favorites') list = list.filter((track) => favorites.has(track.id));
    if (activeCategory === 'Music' || activeCategory === 'Playlists') list = tracks;
    const query = searchQuery.trim().toLowerCase();
    if (activeTab === 'Search' && query) {
      list = list.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(query));
    }
    return list;
  }, [tracks, activeCategory, favorites, searchQuery, activeTab]);

  const openUpload = async () => {
    setUploadOpen(true);
    setPassword('');
    setLoginError('');
    setUploadError('');
    try {
      const response = await fetch('/api/admin/session', { cache: 'no-store' });
      const result = await response.json();
      setAuthenticated(Boolean(result.authenticated));
    } catch {
      setAuthenticated(false);
    }
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab === 'Search') setActiveCategory('Music');
  };

  const playTrack = (track) => {
    if (!track?.url) {
      notify('Starter artwork only — open Library and upload an audio file to stream your own music.');
      return;
    }
    if (activeTrack?.id === track.id && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      else audioRef.current.pause();
      return;
    }
    setActiveTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!activeTrack?.url) {
      if (tracks.length) setActiveTrack(tracks[0]);
      else notify('Upload your first track from Library to start streaming.');
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    else audio.pause();
  };

  const nextTrack = () => {
    if (!tracks.length) return notify('Upload music to build your listening queue.');
    const index = tracks.findIndex((track) => track.id === activeTrack?.id);
    setActiveTrack(tracks[(index + 1 + tracks.length) % tracks.length]);
  };

  const previousTrack = () => {
    if (!tracks.length) return notify('Upload music to build your listening queue.');
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const index = tracks.findIndex((track) => track.id === activeTrack?.id);
    setActiveTrack(tracks[(index - 1 + tracks.length) % tracks.length]);
  };

  const toggleFavorite = (id) => {
    setFavorites((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sign in.');
      setAuthenticated(true);
      setPassword('');
    } catch (error) {
      setLoginError(error.message || 'Could not reach the upload server.');
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setUploadError('');
    if (!audioFile) return setUploadError('Choose an audio file first.');
    if (!uploadTitle.trim() || !uploadArtist.trim()) return setUploadError('Enter both the song title and artist.');
    const payload = new FormData();
    payload.append('title', uploadTitle.trim());
    payload.append('artist', uploadArtist.trim());
    payload.append('audio', audioFile);
    setUploading(true);
    try {
      const response = await fetch('/api/tracks', { method: 'POST', body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      setUploadTitle('');
      setUploadArtist('');
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadTracks();
      notify(`“${result.track.title}” is now in your BCR library.`);
    } catch (error) {
      setUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const song = tracks.find((track) => track.id === id);
    if (!song || !window.confirm(`Delete “${song.title}” from BCR Streamer?`)) return;
    try {
      const response = await fetch(`/api/tracks/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Delete failed.');
      if (activeTrack?.id === id) setActiveTrack(null);
      setFavorites((old) => { const next = new Set(old); next.delete(id); return next; });
      await loadTracks();
      notify('Track removed from the library.');
    } catch (error) {
      setUploadError(error.message || 'Delete failed.');
    }
  };

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }); } catch { /* logged out locally either way */ }
    setAuthenticated(false);
    setPassword('');
  };

  const homeTracks = activeCategory === 'Favorites'
    ? tracks.filter((track) => favorites.has(track.id))
    : tracks.slice(0, 3);
  const cardsToShow = homeTracks.length ? homeTracks : (activeCategory === 'Favorites' ? [] : SAMPLE_TRACKS);

  return (
    <div className="app-backdrop">
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="status-bar" aria-label="Device status">
            <span>10:24</span>
            <div className="status-icons"><Signal size={15} strokeWidth={3} /><Wifi size={17} strokeWidth={2.8} /><BatteryFull size={20} strokeWidth={2.5} /></div>
          </div>

          <header className="app-header">
            <button className="header-icon" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu"><Menu size={28} /></button>
            <button className="brand-button" onClick={() => { setActiveTab('Home'); setActiveCategory('Music'); }}><BrandLogo /></button>
            <button className="header-icon" onClick={() => selectTab('Search')} aria-label="Search music"><Search size={30} /></button>
            {menuOpen && (
              <div className="header-menu">
                <button onClick={() => { selectTab('Home'); setActiveCategory('Music'); }}><Home size={16} /> Home</button>
                <button onClick={() => selectTab('Library')}><Library size={16} /> My library</button>
                <button onClick={openUpload}><LockKeyhole size={16} /> Upload access</button>
              </div>
            )}
          </header>
          <div className="tagline">YOUR MUSIC <span>·</span> YOUR VIBE <span>·</span> ANYTIME</div>

          <main className="screen-content">
            {activeTab === 'Home' && (
              <>
                <section className="hero-banner">
                  <img className="hero-art" src="/artwork/hero-stage.svg" alt="Singer on a blue-lit stage" />
                  <div className="hero-shade" />
                  <div className="hero-copy">
                    <div className="hero-kicker">STREAM</div>
                    <h1>YOUR WORLD</h1>
                    <p>Music <span>·</span> Videos <span>·</span> Artists<br />All in one place</p>
                    <button className="play-now" onClick={() => tracks.length ? playTrack(activeTrack?.url ? activeTrack : tracks[0]) : openUpload()}>
                      <Play size={17} fill="currentColor" /> {tracks.length ? 'Play Now' : 'Start Streaming'}
                    </button>
                  </div>
                  <div className="banner-dots" aria-label="Featured slide"><span className="active" /><span /><span /><span /></div>
                </section>

                <section className="category-grid" aria-label="Explore BCR Streamer">
                  {CATEGORY_ITEMS.map(({ label, icon: Icon }) => (
                    <button key={label} className={`category-tile ${activeCategory === label ? 'category-tile--selected' : ''}`} onClick={() => setActiveCategory(label)}>
                      <Icon size={39} strokeWidth={label === 'Favorites' ? 0 : 2.4} fill={label === 'Favorites' ? 'currentColor' : 'none'} />
                      <span>{label}</span>
                    </button>
                  ))}
                </section>

                <section className="recent-section">
                  <div className="section-heading">
                    <h2>{activeCategory === 'Favorites' ? 'Your Favorites' : activeCategory === 'Videos' ? 'Watch on BCR' : activeCategory === 'Playlists' ? 'Your Playlists' : 'Recently Played'}</h2>
                    <button className="see-all" onClick={() => selectTab('Library')}>See All <ChevronRight size={18} /></button>
                  </div>
                  {activeCategory === 'Videos' ? (
                    <div className="feature-empty"><MonitorPlay size={30} /><div><strong>Videos are on the roadmap</strong><span>Music streaming is ready for your uploads first.</span></div></div>
                  ) : activeCategory === 'Playlists' ? (
                    <button className="playlist-feature" onClick={() => { setActiveTab('Library'); setActiveCategory('Playlists'); }}>
                      <span className="playlist-art"><ListMusic size={30} /></span><span><strong>BCR Essentials</strong><small>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} in your library</small></span><ChevronRight size={20} />
                    </button>
                  ) : cardsToShow.length ? (
                    <div className="track-grid">
                      {cardsToShow.map((track, index) => (
                        <TrackCard key={track.id} track={track} index={tracks.length ? tracks.findIndex((item) => item.id === track.id) : index} onPlay={playTrack} active={activeTrack?.id === track.id} favorite={favorites.has(track.id)} onFavorite={track.artOnly ? undefined : toggleFavorite} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state"><Heart size={25} /><strong>No favorites yet</strong><span>Tap the heart on a track to save it here.</span></div>
                  )}
                </section>
              </>
            )}

            {activeTab === 'Search' && (
              <section className="page-section search-page">
                <div className="page-eyebrow">FIND YOUR SOUND</div><h1>Search</h1>
                <label className="search-field"><Search size={19} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Songs, artists, and more" autoFocus /><button onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button></label>
                <div className="section-heading search-results-heading"><h2>{searchQuery ? 'Search results' : 'Your music'}</h2><span className="muted-count">{visibleTracks.length} tracks</span></div>
                {visibleTracks.length ? visibleTracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={playTrack} active={activeTrack?.id === track.id} favorite={favorites.has(track.id)} onFavorite={toggleFavorite} />) : <div className="empty-state"><Search size={26} /><strong>{searchQuery ? 'No matches found' : 'Your search starts here'}</strong><span>{searchQuery ? 'Try another title or artist.' : 'Upload music to fill your library with tracks.'}</span><button className="outline-action" onClick={openUpload}><UploadCloud size={16} /> Upload music</button></div>}
              </section>
            )}

            {activeTab === 'Library' && (
              <section className="page-section library-page">
                <div className="library-topline"><div><div className="page-eyebrow">YOUR COLLECTION</div><h1>My Library</h1></div><button className="upload-button" onClick={openUpload}><UploadCloud size={17} /> Upload</button></div>
                <div className="library-stats"><div><Music2 size={18} /><strong>{tracks.length}</strong><span>Tracks</span></div><div><Heart size={18} /><strong>{favorites.size}</strong><span>Favorites</span></div><div><Clock3 size={18} /><strong>Anytime</strong><span>Your vibe</span></div></div>
                <div className="library-filter"><span>TRACKS</span><button onClick={() => setActiveCategory(activeCategory === 'Favorites' ? 'Music' : 'Favorites')} className={activeCategory === 'Favorites' ? 'filter-active' : ''}><SlidersHorizontal size={15} /> {activeCategory === 'Favorites' ? 'Favorites' : 'All music'}</button></div>
                {(activeCategory === 'Favorites' ? tracks.filter((track) => favorites.has(track.id)) : tracks).length ? (activeCategory === 'Favorites' ? tracks.filter((track) => favorites.has(track.id)) : tracks).map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={playTrack} active={activeTrack?.id === track.id} favorite={favorites.has(track.id)} onFavorite={toggleFavorite} />) : (
                  <div className="library-empty"><div className="empty-disc"><Music2 size={34} /></div><h2>Your library, your sound.</h2><p>Upload music using your private access password. Your tracks will appear here and can be streamed from any device that can reach this app.</p><button className="primary-action" onClick={openUpload}><LockKeyhole size={17} /> Open Upload Access</button></div>
                )}
              </section>
            )}

            {activeTab === 'Profile' && (
              <section className="page-section profile-page">
                <div className="profile-avatar"><CircleUserRound size={56} strokeWidth={1.3} /></div><div className="page-eyebrow">WELCOME TO BCR</div><h1>Your music space.</h1><p className="profile-intro">A home for your music, your vibe, and the tracks you want to share.</p>
                <div className="profile-card"><div className="profile-card-icon"><ShieldCheck size={23} /></div><div><strong>Music Upload Access</strong><span>Password protected for the BCR owner</span></div><button onClick={openUpload} aria-label="Open music upload access"><ChevronRight size={20} /></button></div>
                <div className="profile-card"><div className="profile-card-icon"><Library size={23} /></div><div><strong>Your Library</strong><span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} available to stream</span></div><button onClick={() => selectTab('Library')} aria-label="Open library"><ChevronRight size={20} /></button></div>
                <div className="profile-footer">BCR STUDIOS <span>·</span> YOUR MUSIC. YOUR VIBE.</div>
              </section>
            )}
          </main>

          <section className="mini-player" aria-label="Music player">
            <div className="player-cover"><CoverArt index={activeTrack ? Math.max(0, tracks.findIndex((item) => item.id === activeTrack.id)) : 0} title={activeTrack?.title || 'BCR Streamer'} /></div>
            <div className="player-track"><strong>{activeTrack?.title || (tracks.length ? tracks[0].title : 'Your next track')}</strong><span>{activeTrack?.artist || (tracks.length ? tracks[0].artist : 'BCR Studios')}</span></div>
            <div className="player-controls">
              <button className="player-skip" onClick={previousTrack} aria-label="Previous track"><SkipBack size={18} fill="currentColor" /></button>
              <button className="player-toggle" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button>
              <button className="player-skip" onClick={nextTrack} aria-label="Next track"><SkipForward size={18} fill="currentColor" /></button>
              <button className="player-queue" onClick={() => selectTab('Library')} aria-label="Open queue"><Menu size={22} /></button>
            </div>
            {activeTrack?.url && duration > 0 && <div className="progress-line"><span style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }} /></div>}
          </section>

          <nav className="bottom-nav" aria-label="Main navigation">
            {NAV_ITEMS.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => selectTab(label)} className={`nav-item ${activeTab === label ? 'nav-item--active' : ''}`}>
                <Icon size={28} strokeWidth={activeTab === label ? 2.5 : 2} fill={activeTab === label && label === 'Home' ? 'currentColor' : 'none'} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="home-indicator" aria-hidden="true"><span /></div>
        </div>
      </div>

      <div className="theme-caption"><span>SKY BLUE &amp; SILVER</span></div>
      <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onEnded={nextTrack} preload="metadata" />

      {uploadOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setUploadOpen(false); }}>
          <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-heading">
            <div className="modal-top"><div className="modal-emblem"><LockKeyhole size={22} /></div><button className="close-modal" onClick={() => setUploadOpen(false)} aria-label="Close upload window"><X size={22} /></button></div>
            {!authenticated ? (
              <>
                <div className="modal-eyebrow">BCR STUDIOS · OWNER ACCESS</div><h2 id="upload-heading">Unlock Music Uploads</h2><p className="modal-description">Enter your private upload password to add music to BCR Streamer. This access is separate from listener playback.</p>
                <form onSubmit={handleLogin} className="modal-form">
                  <label htmlFor="admin-password">Upload password</label>
                  <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
                  {loginError && <div className="form-error">{loginError}</div>}
                  <button type="submit" className="primary-action"><LockKeyhole size={17} /> Unlock Upload Access</button>
                </form>
                <div className="security-note"><ShieldCheck size={16} /> Protected by a server-verified password</div>
              </>
            ) : (
              <>
                <div className="modal-eyebrow">OWNER ACCESS VERIFIED</div><h2 id="upload-heading">Upload Music</h2><p className="modal-description">Add an audio file and song details. The track will be available in the public BCR library after upload.</p>
                <form onSubmit={handleUpload} className="modal-form">
                  <label htmlFor="song-title">Song title</label><input id="song-title" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} maxLength={80} placeholder="e.g. BCR Forever" required />
                  <label htmlFor="song-artist">Artist</label><input id="song-artist" value={uploadArtist} onChange={(event) => setUploadArtist(event.target.value)} maxLength={80} placeholder="e.g. BCR Studios" required />
                  <label className="file-drop" htmlFor="song-file"><UploadCloud size={25} /><strong>{audioFile ? audioFile.name : 'Choose your audio file'}</strong><span>MP3, WAV, M4A, AAC, OGG, FLAC · up to 100 MB</span><input id="song-file" ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.webm,audio/*" onChange={(event) => setAudioFile(event.target.files?.[0] || null)} /></label>
                  {uploadError && <div className="form-error">{uploadError}</div>}
                  <button type="submit" className="primary-action" disabled={uploading}>{uploading ? <><span className="spinner" /> Uploading…</> : <><UploadCloud size={18} /> Upload to BCR Streamer</>}</button>
                </form>
                <div className="admin-library-heading"><strong>Uploaded tracks</strong><span>{tracks.length}</span></div>
                <div className="admin-track-list">{tracks.length ? tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={playTrack} active={activeTrack?.id === track.id} showDelete onDelete={handleDelete} />) : <div className="admin-no-tracks">Your uploaded tracks will show here.</div>}</div>
                <button className="logout-action" onClick={logout}><LogOut size={16} /> Lock upload access</button>
              </>
            )}
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </div>
  );
}
