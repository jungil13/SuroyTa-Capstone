const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

// Search route
router.get('/searcha', searchController.search);

module.exports = router;
