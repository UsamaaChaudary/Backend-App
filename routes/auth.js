const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetchuser = require('../middleware/fetchuser');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'anasisagood$boy'; // for debugging
console.log('auth.js: Starting, JWT_SECRET:', JWT_SECRET);

router.post(
  '/signup',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Signup validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        console.log('Signup: User already exists:', email);
        return res.status(400).json({ success: false, msg: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ name, email, password: hashedPassword });
      await user.save();
      console.log('Signup: User created:', user.id);

      const data = { user: { id: user.id } };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });
      console.log('Signup: Token generated:', authtoken.substring(0, 10) + '...', 'Payload:', data);

      res.status(201).json({ success: true, msg: 'User registered successfully', authtoken });
    } catch (error) {
      console.error('Signup error:', error.message, error.stack);
      res.status(500).json({ success: false, msg: 'Server Error', error: error.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        console.log('Login: User not found:', email);
        return res.status(400).json({ success: false, msg: 'Invalid email or password' });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        console.log('Login: Incorrect password for:', email);
        return res.status(400).json({ success: false, msg: 'Invalid email or password' });
      }

      const data = { user: { id: user.id } };
      const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });
      console.log('Login: Token generated:', authtoken.substring(0, 10) + '...', 'Payload:', data);
      res.json({
        success: true,
        authtoken,
        user: {
          id: user.id,
          email: user.email, 
        }
      });
      
    } catch (error) {
      console.error('Login error:', error.message, error.stack);
      res.status(500).json({ success: false, msg: 'Internal Server Error', error: error.message });
    }
  }
);

router.post('/favorites', fetchuser, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('POST /favorites: User ID is required');
      return res.status(400).json({ success: false, msg: 'User ID is required' });
    }

    const { wallpaperId, webformatURL, largeImageURL } = req.body;
    const userId = req.user.id;
    console.log(`POST /favorites: Adding favorite for user ${userId}, wallpaper ${wallpaperId}`);

    if (!wallpaperId || !webformatURL || !largeImageURL) {
      console.log('POST /favorites: Missing required fields:', { wallpaperId, webformatURL, largeImageURL });
      return res.status(400).json({ success: false, msg: 'Missing required fields' });
    }

    const existing = await Favorite.findOne({ userId, wallpaperId });
    if (existing) {
      console.log(`POST /favorites: Wallpaper ${wallpaperId} already in favorites for user ${userId}`);
      return res.status(400).json({ success: false, msg: 'Wallpaper already in favorites' });
    }

    const favorite = new Favorite({
      userId,
      wallpaperId,
      webformatURL,
      largeImageURL
    });

    await favorite.save();
    console.log(`POST /favorites: Favorite saved for user ${userId}, wallpaper ${wallpaperId}`);
    res.status(201).json({ success: true, favorite });
  } catch (err) {
    console.error('POST /favorites error:', err.message, err.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});

router.get('/favorites', fetchuser, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('GET /favorites: User ID is required');
      return res.status(400).json({ success: false, msg: 'User ID is required' });
    }

    const userId = req.user.id;
    console.log(`GET /favorites: Fetching favorites for user ${userId}`);
    const favorites = await Favorite.find({ userId });
    console.log(`GET /favorites: Found ${favorites.length} favorites for user ${userId}`);
    res.status(200).json({ success: true, favorites });
  } catch (err) {
    console.error('GET /favorites error:', err.message, err.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});

router.delete('/favorites/:wallpaperId', fetchuser, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('DELETE /favorites: User ID is required');
      return res.status(400).json({ success: false, msg: 'User ID is required' });
    }

    const userId = req.user.id;
    const { wallpaperId } = req.params;
    console.log(`DELETE /favorites: Removing favorite ${wallpaperId} for user ${userId}`);

    const result = await Favorite.deleteOne({ userId, wallpaperId });
    if (result.deletedCount === 0) {
      console.log(`DELETE /favorites: Favorite ${wallpaperId} not found for user ${userId}`);
      return res.status(404).json({ success: false, msg: 'Favorite not found' });
    }

    console.log(`DELETE /favorites: Favorite ${wallpaperId} removed for user ${userId}`);
    res.status(200).json({ success: true, msg: 'Removed from favorites' });
  } catch (err) {
    console.error('DELETE /favorites error:', err.message, err.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      console.log('POST /upload/image: No image uploaded');
      return res.status(400).json({ success: false, msg: 'No image uploaded' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log('POST /upload/image: Image uploaded:', imageUrl);
    res.json({ success: true, msg: 'Image uploaded successfully', imageUrl });
  } catch (err) {
    console.error('POST /upload/image error:', err.message, err.stack);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});

router.get('/images', (req, res) => {
  const directoryPath = path.join(__dirname, '../Uploads');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('GET /images error:', err.message, err.stack);
      return res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
    }

    const imageUrls = files.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file}`;
    });
    console.log('GET /images: Found', imageUrls.length, 'images');
    res.json({ success: true, imageUrls });
  });
});
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security validation
    if (!filename || filename.includes('..') || filename.includes('/')) {
      console.log('DELETE /delete: Invalid filename:', filename);
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid filename format' 
      });
    }

    const filePath = path.join(__dirname, '../Uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('DELETE /delete: File not found:', filename);
      return res.status(404).json({ 
        success: false, 
        msg: 'File not found' 
      });
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('DELETE /delete error:', err.message, err.stack);
        return res.status(500).json({ 
          success: false, 
          msg: 'Failed to delete file',
          error: err.message 
        });
      }

      console.log('DELETE /delete: Successfully deleted:', filename);
      res.json({ 
        success: true, 
        msg: 'Image deleted successfully',
        deletedFile: filename 
      });
    });

  } catch (err) {
    console.error('DELETE /delete unexpected error:', err.message, err.stack);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});



module.exports = router;