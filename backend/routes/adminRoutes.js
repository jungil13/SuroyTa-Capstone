// server/routes/adminRoutes.js
const express = require('express');
const adminController = require('../controllers/adminController'); // Ensure this uses require as well

const router = express.Router();

// Get all users
router.get('/users', adminController.getAllUsers);

// Route to restrict a user
router.patch('/users/:id/restrict', adminController.RestrictUser);

// Route to unrestrict a user
router.patch('/users/:id/unrestrict', adminController.UnrestrictUser);


module.exports = router;