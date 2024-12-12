const multer = require('multer');
const path = require('path');
const Promotion = require('../models/promotionModel');
const db = require('../config/db');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
    }
    cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

exports.uploadMiddleware = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    if (err) {
      return res.status(400).json({ message: 'Invalid file format', error: err.message });
    }
    next();
  });
};

exports.createPromotion = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.user_id) {
      return res.status(401).json({ message: 'Unauthorized: Invalid user' });
    }

    const { title, description, startDate, endDate, destination, latitude, longitude } = req.body;
    const authorId = user.user_id;

    // Basic validations
    if (!title || !description || !startDate || !endDate || !destination) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }

    const businessCertificate = req.files?.certificate?.[0]?.filename;
    if (!businessCertificate) {
      return res.status(400).json({ message: 'Business certificate is required' });
    }

    const imageUrls = (req.files.images || []).map((file) => `/uploads/${file.filename}`);

    const promotionData = {
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      destination,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      author_id: authorId,
      business_certificate: `/uploads/${businessCertificate}`,
    };

    Promotion.createPromotion(promotionData, imageUrls, (err, promotionId) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating promotion', error: err.message });
      }
      res.status(201).json({ message: 'Promotion created successfully', promotionId });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating promotion', error: err.message });
  }
};


// Get All Promotions
exports.getAllPromotions = async (req, res) => {
  try {
    // Extract pagination parameters with default values
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
    const offset = (page - 1) * limit;

    const [promotions, totalCount] = await new Promise((resolve, reject) => {
      Promotion.getAllPromotionsWithPagination(limit, offset, (err, results, count) => {
        if (err) {
          console.error('Error fetching promotions:', err);
          return reject(err);
        }
        resolve([results, count]);
      });
    });

    if (!promotions || promotions.length === 0) {
      return res.status(404).json({ message: 'No promotions found' });
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      data: promotions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      message: 'Error retrieving promotions',
      error: err.message,
    });
  }
};


exports.getPromotionById = (req, res) => {
  const { id } = req.params;

  Promotion.getPromotionById(id, (err, promotion) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving promotion', error: err.message });
    }

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.status(200).json(promotion);
  });
};

exports.getPromotionsByAuthorId = async (req, res) => {
  const { author_id } = req.params;

  try {
    const promotions = await Promotion.getPromotionsByAuthorId(author_id);

    // Check if the user has any promotions
    if (promotions.length === 0) {
      return res.status(404).json({ message: "No promotions found for this user." });
    }

    res.status(200).json(promotions);
  } catch (error) {
    console.error("Error fetching promotions by author:", error.message);
    res.status(500).json({ error: "Failed to fetch promotions.", details: error.message });
  }
};

exports.getAllApprovedPromotions = (req, res) => {
  Promotion.getAllApprovedPromotions((err, promotions) => {
    if (err) {
      // Send a detailed error message in case of failure
      return res.status(500).json({
        message: "Error fetching approved promotions",
        error: err.message || "Unknown error",
      });
    }
    // If no promotions are found, return an empty array with a 200 status
    res.status(200).json(promotions || []);
  });
};

// Update promotion status
exports.updatePromotionStatus = (req, res) => {
  const promotionId = req.params.id;
  const { status } = req.body;

  if (!status || !['approved', 'pending', 'denied'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  Promotion.updatePromotionStatus(promotionId, status, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error updating promotion status", error: err.message });
    }
    res.status(200).json(result);
  });
};
