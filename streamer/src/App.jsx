
    
  
              <>
                <section className="hero-banner">
                  <img className="hero-art" src="/artwork/hero-stage.svg" alt="Singer on a blue-lit stage" />
                  <div className="hero-shade" />
                  <div className="hero-copy">
                    <div className="hero-kicker">STREAM</div>
                    <h1>YOUR WORLD</h1>
                    <p>Music <span>·</span> Videos <span>·</span> Artists<br />All in one place</p>
                    <button className="play-now" onClick={() => { if (tracks.length) playTrack(activeTrack?.url ? activeTrack : tracks[0]); }}>
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
                {visibleTracks.length ? visibleTracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={playTrack} active={activeTrack?.id === track.id} favorite={favorites.has(track.id)} onFavorite={toggleFavorite} />) : <div className="empty-state"><Search size={26} /><strong>{searchQuery ? 'No matches found' : 'Your search starts here'}</strong><span>{searchQuery ? 'Try another title or artist.' : 'Songs added to the BCR music folder will appear here after deployment.'}</span></div>}
              </section>
            )}

            {activeTab === 'Library' && (
              <section className="page-section library-page">
                <div className="library-topline"><div><div className="page-eyebrow">YOUR COLLECTION</div><h1>My Library</h1></div></div>
                <div className="library-stats"><div><Music2 size={18} /><strong>{tracks.length}</strong><span>Tracks</span></div><div><Heart size={18} /><strong>{favorites.size}</strong><span>Favorites</span></div><div><Clock3 size={18} /><strong>Anytime</strong><span>Your vibe</span></div></div>
                <div className="library-filter"><span>TRACKS</span><button onClick={() => setActiveCategory(activeCategory === 'Favorites' ? 'Music' : 'Favorites')} className={activeCategory === 'Favorites' ? 'filter-active' : ''}><SlidersHorizontal size={15} /> {activeCategory === 'Favorites' ? 'Favorites' : 'All music'}</button></div>
                {(activeCategory === 'Favorites' ? tracks.filter((track) => favorites.has(track.id)) : tracks).length ? (activeCategory === 'Favorites' ? tracks.filter((track) => favorites.has(track.id)) : tracks).map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={playTrack} active={activeTrack?.id === track.id} favorite={favorites.has(track.id)} onFavorite={toggleFavorite} />) : (
                  <div className="library-empty"><div className="empty-disc"><Music2 size={34} /></div><h2>Your library, your sound.</h2><p>Add MP3 files to the BCR music folder on GitHub, commit the changes, and redeploy. Your songs will then appear here.</p><a className="outline-action" href="https://github.com/makumejohn/bcr-studios-website/tree/my-rirst-branch/streamer/public/artwork/music/music" target="_blank" rel="noreferrer">Manage songs on GitHub</a></div>
                )}
              </section>
            )}

            {activeTab === 'Profile' && (
              <section className="page-section profile-page">
                <div className="profile-avatar"><CircleUserRound size={56} strokeWidth={1.3} /></div><div className="page-eyebrow">WELCOME TO BCR</div><h1>Your music space.</h1><p className="profile-intro">A home for your music, your vibe, and the tracks you want to share.</p>
                <div className="profile-card"><div className="profile-card-icon"><Library size={23} /></div><div><strong>Your Music Library</strong><span>Songs are managed through GitHub</span></div><button onClick={() => selectTab('Library')} aria-label="Open music library"><ChevronRight size={20} /></button></div>
                <div className="profile-card"><div className="profile-card-icon"><Library size={23} /></div><div><strong>Your Library</strong><span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} available to stream</span></div><button onClick={() => selectTab('Library')} aria-label="Open library"><ChevronRight size={20} /></button></div>
                <div className="profile-footer">BCR STUDIOS <span>·</span> YOUR MUSIC. YOUR VIBE.</div>
              </section>
            )}
          </main>

          <section className="mini-player" aria-label="Music player">
            <div className="player-cover"><CoverArt index={activeTrack ? Math.max(0, tracks.findIndex((item) => item.id === activeTrack.id)) : 0} title={activeTrack?.title || 'BCR Streamer'} artwork={activeTrack?.artwork} /></div>
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

      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </div>
  );
}

