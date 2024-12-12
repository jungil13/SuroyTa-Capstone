// server/controllers/adminController.js
const User = require('../models/adminModel');
const db = require('../config/db');

exports.getAllUsers = (req, res) => {
  User.getAllUsers((err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Error fetching users', error: err });
    }
    res.json(users);
  });
};

// Method to restrict a user
exports.RestrictUser = (req, res) => {
  const userId = req.params.id;

  // Update the user's 'is_restricted' status
  const updateQuery = 'UPDATE users SET is_restricted = TRUE WHERE user_id = ?';
  
  db.query(updateQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error restricting user:', err);
      return res.status(500).json({ message: 'Error restricting user', error: err });
    }

    // Check if any rows were updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve the updated user
    const selectQuery = 'SELECT * FROM users WHERE user_id = ?';
    db.query(selectQuery, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching updated user:', err);
        return res.status(500).json({ message: 'Error fetching updated user', error: err });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(rows[0]); // Return the updated user
    });
  });
};

// Method to unrestrict a user
exports.UnrestrictUser = (req, res) => {
  const userId = req.params.id;

  // Update the user's 'is_restricted' status
  const updateQuery = 'UPDATE users SET is_restricted = FALSE WHERE user_id = ?';
  
  db.query(updateQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error unrestricting user:', err);
      return res.status(500).json({ message: 'Error unrestricting user', error: err });
    }

    // Check if any rows were updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve the updated user
    const selectQuery = 'SELECT * FROM users WHERE user_id= ?';
    db.query(selectQuery, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching updated user:', err);
        return res.status(500).json({ message: 'Error fetching updated user', error: err });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(rows[0]); // Return the updated user
    });
  });
};
