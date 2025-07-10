let folders = [];
let allSongs = [];
let favorites = [];
let currentSongs = [];
let currentSongIndex = 0;
let isPlaying = false;
let repeatMode = 'all'; // all, one, shuffle
let isMuted = false;

const audio = document.getElementById("audio");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const coverArt = document.getElementById("cover-art");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const volume = document.getElementById("volume");
const playlistEl = document.getElementById("playlist");
const favBtn = document.getElementById("fav");
const repeatBtn = document.getElementById("repeat");
const muteBtn = document.getElementById("mute");
const folderList = document.getElementById("folder-list");

fetch('/api/folders')
  .then(res => res.json())
  .then(data => {
    folders = data;
    allSongs = folders.flatMap(f => f.songs);
    currentSongs = allSongs;
    buildFolderButtons();
    buildPlaylist();
    loadSong(0);
  })
  .catch(err => console.error("Failed to load playlist:", err));

function buildFolderButtons() {
  folderList.innerHTML = '';

  const allBtn = document.createElement("button");
  allBtn.textContent = "All Songs";
  allBtn.onclick = () => {
    currentSongs = allSongs;
    buildPlaylist();
    loadSong(0);
  };
  folderList.appendChild(allBtn);

  const favBtnEl = document.createElement("button");
  favBtnEl.textContent = "❤️ Favorites";
  favBtnEl.onclick = () => {
    currentSongs = allSongs.filter(s => favorites.includes(s.src));
    buildPlaylist();
    if (currentSongs.length > 0) loadSong(0);
  };
  folderList.appendChild(favBtnEl);

  folders.forEach(folder => {
    const btn = document.createElement("button");
    btn.textContent = folder.folder;
    btn.onclick = () => {
      currentSongs = folder.songs;
      buildPlaylist();
      loadSong(0);
    };
    folderList.appendChild(btn);
  });
}

function buildPlaylist() {
  playlistEl.innerHTML = '';
  currentSongs.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = `${song.title} - ${song.artist}`;
    if (favorites.includes(song.src)) li.classList.add("favorite");
    li.onclick = () => { loadSong(index); playSong(); };
    playlistEl.appendChild(li);
  });
}

function loadSong(index) {
  if (index < 0 || index >= currentSongs.length) return;
  currentSongIndex = index;
  const song = currentSongs[index];
  audio.src = song.src;
  title.textContent = song.title;
  artist.textContent = song.artist;
  coverArt.src = song.cover || "covers/default.png";
  updateActivePlaylist();
}

function playSong() { audio.play(); isPlaying = true; playBtn.textContent = "⏸️"; }
function pauseSong() { audio.pause(); isPlaying = false; playBtn.textContent = "▶️"; }

playBtn.onclick = () => isPlaying ? pauseSong() : playSong();
prevBtn.onclick = () => {
  currentSongIndex = (currentSongIndex - 1 + currentSongs.length) % currentSongs.length;
  loadSong(currentSongIndex); playSong();
};
nextBtn.onclick = nextSongAuto;
favBtn.onclick = toggleFavorite;
repeatBtn.onclick = toggleRepeatMode;
muteBtn.onclick = toggleMute;

volume.oninput = () => {
  audio.volume = volume.value;
  if (audio.volume === 0) { isMuted = true; muteBtn.textContent = "🔇"; }
  else { isMuted = false; muteBtn.textContent = "🔊"; }
};
progress.oninput = () => { audio.currentTime = progress.value; };

audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("loadedmetadata", () => {
  progress.max = audio.duration;
  durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener("ended", onSongEnd);

function updateProgress() {
  progress.value = audio.currentTime;
  currentTimeEl.textContent = formatTime(audio.currentTime);
}
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function updateActivePlaylist() {
  Array.from(playlistEl.children).forEach((li, i) => {
    li.classList.toggle("active", i === currentSongIndex);
  });
}
function toggleFavorite() {
  const song = currentSongs[currentSongIndex];
  const idx = favorites.indexOf(song.src);
  if (idx === -1) favorites.push(song.src);
  else favorites.splice(idx, 1);
  buildPlaylist();
}
function toggleRepeatMode() {
  repeatMode = repeatMode === 'all' ? 'one' : repeatMode === 'one' ? 'shuffle' : 'all';
  repeatBtn.textContent = `Mode: ${repeatMode}`;
}
function toggleMute() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}
function onSongEnd() {
  if (repeatMode === 'one') {
    audio.currentTime = 0; playSong();
  } else if (repeatMode === 'shuffle') {
    currentSongIndex = Math.floor(Math.random() * currentSongs.length);
    loadSong(currentSongIndex); playSong();
  } else {
    nextSongAuto();
  }
}
function nextSongAuto() {
  currentSongIndex = (currentSongIndex + 1) % currentSongs.length;
  loadSong(currentSongIndex); playSong();
}
