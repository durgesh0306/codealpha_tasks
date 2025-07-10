const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/music', express.static('music')); // serve music files

// Session config
app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: true
}));

// --- LOGIN ---
const ADMIN_PASSWORD = 'admin123';

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// --- MIDDLEWARE: protect admin routes ---
function checkAuth(req, res, next) {
  if (req.session.authenticated) next();
  else res.status(403).json({ message: 'Unauthorized' });
}

// --- LIST folders & songs ---
app.get('/api/folders', (req, res) => {
  const folders = fs.readdirSync('./music', { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const files = fs.readdirSync('./music/' + d.name)
        .filter(f => /\.(mp3|wav|ogg)$/i.test(f))
        .map(f => ({
          src: `music/${d.name}/${f}`,
          title: path.parse(f).name,
          artist: "Unknown",
          cover: "covers/default.png"  // ✅ use default.png
        }));
      return { folder: d.name, songs: files };
    });
  res.json(folders);
});

// --- CREATE folder ---
app.post('/api/folders', checkAuth, (req, res) => {
  const { name } = req.body;
  const folderPath = path.join('./music', name);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    res.json({ success: true });
  } else {
    res.status(400).json({ message: 'Folder exists' });
  }
});

// --- DELETE folder ---
app.delete('/api/folders/:name', checkAuth, (req, res) => {
  const folderPath = path.join('./music', req.params.name);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true });
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Folder not found' });
  }
});

// --- UPLOAD songs ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join('./music', req.params.folder);
    cb(null, folderPath);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.post('/api/folders/:folder/upload', checkAuth, upload.array('songs'), (req, res) => {
  res.json({ success: true, files: req.files.map(f => f.filename) });
});

// --- DELETE song ---
app.delete('/api/folders/:folder/songs/:song', checkAuth, (req, res) => {
  const filePath = path.join('./music', req.params.folder, req.params.song);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Song not found' });
  }
});

// --- START ---
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
