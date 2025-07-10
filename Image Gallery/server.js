const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('basic-auth');
const app = express();

// 🔐 Protect admin.html
app.use('/admin.html', (req, res, next) => {
  const user = auth(req);
  const username = 'ak05';
  const password = 'chotu1ch@i';
  if (user && user.name === username && user.pass === password) {
    return next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }
});

app.use(express.static('public'));
app.use(express.json());


// ✅ Existing route: list all folders & images
app.get('/api/list-all', (req, res) => {
  const imagesDir = path.join(__dirname, 'public/images');
  const categories = {};

  fs.readdir(imagesDir, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: "Failed to read images folder" });

    const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    let pending = folders.length;
    if (!pending) return res.json(categories); // no folders

    folders.forEach(folder => {
      const folderPath = path.join(imagesDir, folder);
      fs.readdir(folderPath, (err, files) => {
        if (!err) {
          categories[folder] = files
            .filter(f => /\.(jpe?g|png|gif)$/i.test(f))
            .map(f => `images/${folder}/${f}`);
        }
        if (!--pending) res.json(categories);
      });
    });
  });
});

// ✅ multer config for uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category;
    const dir = path.join(__dirname, 'public/images', category);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // prevent filename conflicts
  }
});
const upload = multer({ storage });

// ✅ create new folder
app.post('/api/create-folder', (req, res) => {
  const folder = req.body.folder;
  const dir = path.join(__dirname, 'public/images', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Folder already exists' });
  }
});

// ✅ delete folder
app.post('/api/delete-folder', (req, res) => {
  const folder = req.body.folder;
  const dir = path.join(__dirname, 'public/images', folder);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Folder not found' });
  }
});

// ✅ upload image to folder
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// ✅ delete image from folder
app.post('/api/delete-image', (req, res) => {
  const { category, filename } = req.body;
  const filePath = path.join(__dirname, 'public/images', category, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Image not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
