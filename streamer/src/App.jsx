
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  BatteryFull,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Heart,
  Home,
  Library,
  ListMusic,
  Menu,
  MonitorPlay,
  Music2,
  Pause,
  Play,
  Search,
  Signal,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  UserRound,
  Wifi,
  X,
} from 'lucide-react';

const ARTWORK = [
  '/artwork/cover-forever.svg',
  '/artwork/cover-dreams.svg',
  '/artwork/cover-life.svg',
];

const SAMPLE_TRACKS = [
  {
    id: 'told-you-i-can',
    title: 'TOLD YOU I CAN',
    artist: 'BCR Studios',
    url: '/artwork/music/music/TOLD%20YOU%20I%20CAN.mp3',
    artwork: ARTWORK[0],
  },
  {
    id: 'haters-keep-talking',
    title: 'HATERS KEEP TALKING 1',
    artist: 'BCR Studios',
    url: '/artwork/music/music/HATERS%20KEEP%20TALKING%201.mp3',
    artwork: ARTWORK[1],
  },
];

const NAV_ITEMS = [
  { label: 'Home', icon: Home },
  { label: 'Search', icon: Search },
  { label: 'Library', icon: Library },
  { label: 'Profile', icon: UserRound },
];

const CATEGORY_ITEMS = [
  { label: 'Music', icon: Music2 },
  { label: 'Videos', icon: MonitorPlay },
  { label: 'Favorites', icon: Heart },
  { label: 'Playlists', icon: ListMusic },
];

function BrandLogo() {
  return (
    <div className="brand-logo">
      <svg
        viewBox="0 0 64 52"
        width="48"
        height="40"
        role="img"
        aria-label="BCR crown"
      >
        <defs>
          <linearGradient id="bcrSilver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#9eb7d2" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <path
          d="M7 13 L19 24 L31 5 L44 24 L57 13 L51 43 L13 43 Z"
          fill="url(#bcrSilver)"
          stroke="#dcecff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M14 35 H50 M18 40 H46"
          stroke="#6c91b8"
          strokeWidth="2"
        />
        <circle cx="7" cy="11" r="4" fill="#ffffff" />
        <circle cx="31" cy="4" r="4" fill="#ffffff" />
        <circle cx="57" cy="11" r="4" fill="#ffffff" />
      </svg>
      <div className="brand-logo-copy">
        <strong>BCR</strong>
        <span>STREAMER</span>
      </div>
    </div>
  );
}

function CoverArt({ track, index = 0, className = '' }) {
  const src = track?.artwork || ARTWORK[index % ARTWORK.length];

  return (
    <img
      className={`cover-art ${className}`}
      src={src}
      alt={`${track?.title || 'BCR Streamer'} artwork`}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = ARTWORK[0];
      }}
    />
  );
}

function TrackCard({ track, index, active, playing, liked, onPlay, onLike }) {
  return (
    <article className={`track-card ${active ? 'track-card--active' : ''}`}>
      <button
        className="cover-button"
        onClick={() => onPlay(track)}
        aria-label={`Play ${track.title}`}
      >
        <CoverArt track={track} index={index} />
        <span className="cover-play">
          {active && playing ? <Pause size={22} /> : <Play size={22} />}
        </span>
      </button>

      <div className="track-card-meta">
        <div>
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
        <button
          className={`tiny-fav ${liked ? 'row-icon--liked' : ''}`}
          onClick={() => onLike(track.id)}
          aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}

function TrackRow({
  track,
  index,
  active,
  playing,
  liked,
  onPlay,
  onLike,
}) {
  return (
    <div className={`track-row ${active ? 'track-row--active' : ''}`}>
      <button
        className="row-play"
        onClick={() => onPlay(track)}
        aria-label={`Play ${track.title}`}
      >
        {active && playing ? (
          <Pause size={17} />
        ) : (
          <Play size={17} />
        )}
      </button>

      <CoverArt track={track} index={index} />

      <div className="row-copy">
        <div className="row-title">{track.title}</div>
        <div className="row-artist">{track.artist}</div>
      </div>

      <button
        className={`row-icon ${liked ? 'row-icon--liked' : ''}`}
        onClick={() => onLike(track.id)}
        aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export default function App() {
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [activeCategory, setActiveCategory] = useState('Music');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const toastTimer = useRef(null);

  const tracks = SAMPLE_TRACKS;

  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem('bcr-favorites') || '[]')
      );
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'bcr-favorites',
        JSON.stringify([...favorites])
      );
    } catch {
      // The player still works if browser storage is unavailable.
    }
  }, [favorites]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.url) return;

    audio.src = activeTrack.url;
    audio.load();
    setElapsed(0);
    setDuration(0);

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setToast('Tap play to start your music.');
      });
  }, [activeTrack?.id]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  };

  const playTrack = (track) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack?.id === track.id) {
      if (audio.paused) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(() => showToast('Unable to play this track right now.'));
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    setActiveTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!activeTrack) {
      playTrack(tracks[0]);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => showToast('Unable to play this track right now.'));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const nextTrack = () => {
    const currentIndex = tracks.findIndex(
      (track) => track.id === activeTrack?.id
    );
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  const previousTrack = () => {
    const currentIndex = tracks.findIndex(
      (track) => track.id === activeTrack?.id
    );
    const previousIndex =
      (currentIndex <= 0 ? tracks.length : currentIndex) - 1;
    playTrack(tracks[previousIndex]);
  };

  const toggleFavorite = (trackId) => {
    setFavorites((current) => {
      const updated = new Set(current);
      if (updated.has(trackId)) {
        updated.delete(trackId);
        showToast('Removed from favourites.');
      } else {
        updated.add(trackId);
        showToast('Added to favourites.');
      }
      return updated;
    });
  };

  const filteredTracks = useMemo(() => {
    let result = tracks;

    if (activeCategory === 'Favorites') {
      result = result.filter((track) => favorites.has(track.id));
    }

    if (activeTab === 'Search' && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tracks, activeCategory, activeTab, searchQuery, favorites]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    if (tab !== 'Home') setActiveCategory('Music');
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="streamer-app">
      <div className="status-bar">
        <span>10:24</span>
        <div className="status-icons">
          <Signal size={15} />
          <Wifi size={15} />
          <BatteryFull size={17} />
        </div>
      </div>

      <header className="app-header">
        <button
          className="icon-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open menu"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <BrandLogo />

        <button
          className="icon-button"
          onClick={() => selectTab('Profile')}
          aria-label="Open profile"
        >
          <CircleUserRound size={23} />
        </button>
      </header>

      {menuOpen && (
        <div className="menu-panel">
          <button onClick={() => selectTab('Home')}>
            <Home size={18} /> Home
          </button>
          <button onClick={() => selectTab('Search')}>
            <Search size={18} /> Search music
          </button>
          <button onClick={() => selectTab('Library')}>
            <Library size={18} /> My library
          </button>
          <button onClick={() => selectTab('Profile')}>
            <UserRound size={18} /> Profile
          </button>
        </div>
      )}

      <main className="app-content">
        {activeTab === 'Home' && (
          <>
            <section className="welcome-section">
              <p className="page-eyebrow">WELCOME TO BCR STUDIOS</p>
              <h1>Your music.<br />Your sound.</h1>
              <p className="section-subtitle">
                Discover the sound of BCR.
              </p>
            </section>

            <section className="hero-banner">
              <img
                src="/artwork/hero-stage.svg"
                alt="BCR music stage"
                className="hero-art"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <div className="hero-copy">
                <span className="hero-label">BCR STUDIOS PRESENTS</span>
                <h2>Feel the music.</h2>
                <p>Your sound. Your journey. Your vibe.</p>
                <button
                  className="primary-button"
                  onClick={() => playTrack(activeTrack || tracks[0])}
                >
                  <Play size={17} fill="currentColor" />
                  Listen now
                </button>
              </div>
            </section>

            <section className="category-section">
              <div className="section-heading">
                <h2>Explore</h2>
                <SlidersHorizontal size={19} />
              </div>
              <div className="category-grid">
                {CATEGORY_ITEMS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className={`category-item ${
                      activeCategory === label ? 'category-item--active' : ''
                    }`}
                    onClick={() => {
                      setActiveCategory(label);
                      if (label === 'Favorites') {
                        setActiveTab('Library');
                      } else if (label === 'Music' || label === 'Playlists') {
                        setActiveTab('Home');
                      } else {
                        showToast('Videos are coming in a future update.');
                      }
                    }}
                  >
                    <Icon size={22} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="tracks-section">
              <div className="section-heading">
                <div>
                  <p className="page-eyebrow">MADE AT BCR STUDIOS</p>
                  <h2>Featured music</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => selectTab('Library')}
                >
                  View all <ChevronRight size={17} />
                </button>
              </div>

              <div className="track-grid">
                {tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={index}
                    active={activeTrack?.id === track.id}
                    playing={isPlaying}
                    liked={favorites.has(track.id)}
                    onPlay={playTrack}
                    onLike={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'Search' && (
          <section className="page-section">
            <p className="page-eyebrow">FIND YOUR SOUND</p>
            <h1>Search</h1>
            <div className="search-box">
              <Search size={20} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search songs or artists..."
                aria-label="Search songs or artists"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="section-heading">
              <h2>{searchQuery ? 'Search results' : 'All music'}</h2>
              <span className="muted-text">{filteredTracks.length} tracks</span>
            </div>

            {filteredTracks.length ? (
              <div className="track-list">
                {filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    active={activeTrack?.id === track.id}
                    playing={isPlaying}
                    liked={favorites.has(track.id)}
                    onPlay={playTrack}
                    onLike={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={34} />
                <h3>No music found</h3>
                <p>Try another song title or artist.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'Library' && (
          <section className="page-section">
            <p className="page-eyebrow">YOUR MUSIC SPACE</p>
            <h1>My Library</h1>

            <div className="library-tabs">
              <button
                className={activeCategory !== 'Favorites' ? 'active' : ''}
                onClick={() => setActiveCategory('Music')}
              >
                All music
              </button>
              <button
                className={activeCategory === 'Favorites' ? 'active' : ''}
                onClick={() => setActiveCategory('Favorites')}
              >
                <Heart size={16} /> Favorites
              </button>
            </div>

            {filteredTracks.length ? (
              <div className="track-list">
                {filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    active={activeTrack?.id === track.id}
                    playing={isPlaying}
                    liked={favorites.has(track.id)}
                    onPlay={playTrack}
                    onLike={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Heart size={34} />
                <h3>No favourites yet</h3>
                <p>Tap the heart beside a song to save it here.</p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setActiveCategory('Music');
                    setActiveTab('Home');
                  }}
                >
                  Explore music <ChevronRight size={17} />
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'Profile' && (
          <section className="page-section profile-section">
            <p className="page-eyebrow">BCR STUDIOS</p>
            <h1>Your profile</h1>

            <div className="profile-card">
              <div className="profile-avatar">
                <AudioLines size={32} />
              </div>
              <h2>BCR Listener</h2>
              <p>Welcome to your music space.</p>
            </div>

            <div className="profile-info-card">
              <div className="profile-info-icon">
                <Library size={22} />
              </div>
              <div>
                <h3>Your library</h3>
                <p>Listen to BCR music and keep your favourites close.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => selectTab('Library')}
                aria-label="Open library"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="profile-info-card">
              <div className="profile-info-icon">
                <Heart size={22} />
              </div>
              <div>
                <h3>Your favourites</h3>
                <p>{favorites.size} saved {favorites.size === 1 ? 'track' : 'tracks'}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => {
                  setActiveCategory('Favorites');
                  setActiveTab('Library');
                }}
                aria-label="Open favourites"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        )}
      </main>

      {activeTrack && (
        <section className="mini-player">
          <CoverArt
            track={activeTrack}
            index={tracks.findIndex((track) => track.id === activeTrack.id)}
          />

          <div className="mini-player-copy">
            <div className="track-title">{activeTrack.title}</div>
            <div className="track-artist">{activeTrack.artist}</div>
            <div className="player-progress">
              <span
                className="player-progress-fill"
                style={{
                  width: duration
                    ? `${Math.min(100, (elapsed / duration) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            <div className="player-time">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mini-player-controls">
            <button onClick={previousTrack} aria-label="Previous track">
              <SkipBack size={19} />
            </button>
            <button
              className="mini-play-button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
            </button>
            <button onClick={nextTrack} aria-label="Next track">
              <SkipForward size={19} />
            </button>
          </div>
        </section>
      )}

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activeTab === label ? 'nav-item--active' : ''}`}
            onClick={() => selectTab(label)}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <footer className="app-footer">
        <span><Check size={14} /> BCR Studios</span>
        <span>Music for the journey.</span>
      </footer>

      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={nextTrack}
        onError={() => {
          setIsPlaying(false);
          showToast('This audio file could not be loaded.');
        }}
      />

      {toast && (
        <div className="toast-message" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {activeTrack ? `Selected track: ${activeTrack.title}` : ''}
      </div>
    </div>
  );
}
