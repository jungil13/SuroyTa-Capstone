// server/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the CORS middleware
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes'); // Import the post routes
const categoryRoutes = require('./routes/categoryRoutes'); // Import the category routes
const profileRoutes = require('./routes/profile');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const destinationRoute = require('./routes/destinationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const likeRoutes = require('./routes/likeRoutes'); // Import like routes
const userRoutes  = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const ratingsRoute = require('./routes/ratingsRoute');
const topRatedRoutes = require('./routes/topRatedRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const  searchRoutes = require('./routes/searchRoutes');
const punycode = require('punycode'); // Import from npm-installed package
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(cors({
  origin: 'http://localhost:5173', // Adjust to match your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' })); // Increase body size limit

app.use((req, res, next) => {
  res.setTimeout(60000, () => {  // Set timeout to 60 seconds
    res.status(408).send('Request Timeout');
  });
  next();
});
// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes); // Add the post routes
app.use('/api/categories', categoryRoutes); // Add the category routes
app.use('/api/profile', profileRoutes);
app.use('/posts', commentRoutes);
app.use('/comments', commentRoutes);
app.use('/api/admin', adminRoutes); // Use user routes
app.use('/api', commentRoutes); // Use comment routes
app.use('/api', categoryRoutes); // Use category routes
app.use('/api', destinationRoute); // Use destination routes

// count

app.use('/api', adminRoutes); // Use admin routes
app.use('/api', postRoutes); // Use post routes
app.use('/api', commentRoutes); // Use comment routes
app.use('/api', categoryRoutes); // Use category routes
app.use('/api', destinationRoute); // Use destination routes
app.use('/api', dashboardRoutes); // Use dashboard routes
app.use('/api', likeRoutes); // Use like routes
app.use('/api', userRoutes); 
app.use('/api', followRoutes);

app.use('/api/promotions', promotionRoutes);
app.use('/api/promotions', commentRoutes);
app.use('/api/ratings', ratingsRoute);
app.use('/api', topRatedRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/search', searchRoutes);


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});