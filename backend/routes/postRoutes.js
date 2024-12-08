const express = require('express');
const multer = require('multer');
const path = require('path');
const { createPost, getAllPosts, getPostById,updatePost, deletePost, getPostsByDestination,getPostsByCategory} = require('../controllers/postController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();
const { getLatestPosts } = require('../controllers/postController');
const db = require('../config/db');

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}).array('images', 5); // Ensure this matches the frontend field name

// Refactor to handle image upload and post creation in a single function
router.get('/latest', getLatestPosts);


router.post('/', authenticateToken, upload, createPost);
router.get('/', getAllPosts);
router.get('/:id', authenticateToken, getPostById);
router.put('/:id', authenticateToken, upload, updatePost); // Include upload middleware here
router.delete('/:id', authenticateToken,deletePost);
router.get('/destination/:destination',getPostsByDestination);
router.get('/category/:category',getPostsByCategory);
router.patch('/destinations/:id/toggle-hide', async (req, res) => {
  const { id } = req.params;

  try {
    // Use the promise wrapper for db queries
    const promiseDb = db.promise();

    // Fetch the destination's current hidden status
    const [rows] = await promiseDb.query('SELECT hidden FROM posts WHERE post_id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    const destination = rows[0];
    const newHiddenStatus = !destination.hidden;

    // Update hidden status
    const [updateResult] = await promiseDb.query(
      'UPDATE posts SET hidden = ? WHERE post_id = ?',
      [newHiddenStatus, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update hidden status' });
    }

    res.json({
      message: `Destination ${newHiddenStatus ? 'hidden' : 'unhidden'} successfully`,
      hidden: newHiddenStatus,
    });
  } catch (error) {
    console.error('Error toggling hidden status:', error);
    res.status(500).json({
      message: 'Error toggling hidden status',
      error: error.message || error,
    });
  }
});




module.exports = router;