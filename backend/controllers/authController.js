const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);  

const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Check if user exists in database
    let user = await User.findByEmail(payload.email);
    if (!user) {
      user = await User.create({
        email: payload.email,
        username: payload.name,
        profilePhoto: payload.picture,
        user_type: 'User',
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { user_id: user.user_id, username: user.username, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expiration time
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        profilePhoto: user.profilePhoto,
        user_type: user.user_type,
      },
    });
  } catch (error) {
    res.status(400).json({ message: 'Google login failed', error: error.message });
  }
};


const register = (req, res) => {
  const { username, email, password, profilePhoto } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err });

    // Register the user with user_type set to 'Regular'
    User.register(username, email, hash, profilePhoto, 'Regular', (error, results) => {
      if (error) return res.status(500).json({ error });
      res.status(201).json({ message: 'User registered successfully!' });
    });
  });
};


const login = (req, res) => {
  const { email, password } = req.body;  // Use email instead of username

  // If the email is 'Guest', handle it separately
  if (email === 'Guest') {
    // Generate a guest token (no need for password check here)
    const token = jwt.sign(
      { user_id: 'guest', email: 'Guest', user_type: 'Guest', username: 'Guest' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }  // Optional: Set a short expiration for guest tokens
    );

    return res.status(200).json({
      token,
      user: {
        id: 'guest',
        email: 'Guest',
        user_type: 'Guest',
        profilePhoto: 'https://via.placeholder.com/150',  // You can use a placeholder image for guests
        username: 'Guest'
      }
    });
  }

  // Fetch user by email (for non-guest logins)
  User.findByEmail(email, (error, results) => {
    if (error) return res.status(500).json({ error });
    if (results.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = results[0]; // Get the user object from the results
    console.log('User object retrieved:', user); // Log the user object

    // Check if the user is restricted
    if (user.is_restricted) {
      return res.status(403).json({ message: 'Your account is restricted. Please contact support.' });
    }

    // Compare password (for non-guest logins)
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err });
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      // Create JWT token for non-guest users
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, user_type: user.user_type, username: user.username },
        process.env.JWT_SECRET
      );
      console.log('User ID during login:', user.user_id); // Ensure this is not null or undefined
      console.log('Generated Token:', token); // Log token

      // Send the response with the token and user details
      res.status(200).json({
        token,
        user: {
          id: user.user_id,
          email: user.email,  // Return email instead of username
          profilePhoto: user.profile_photo,
          user_type: user.user_type, // Include user_type in the response
          username: user.username // Include username in the response
        },
      });
    });
  });
};



module.exports = { register, login, googleLogin };
