const db = require("../config/db");

const Promotion = {
  getAllPromotions(callback) {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.start_date, 
        p.end_date, 
        p.destination,
        p.status,
        p.business_certificate_image,
        IFNULL(GROUP_CONCAT(pi.image_url), '') AS images,
        u.username AS author_username, 
        u.profile_photo AS author_profile_photo,
        IFNULL(AVG(r.rating_value), 0) AS average_rating,  -- Average rating
        COUNT(r.rating_id) AS total_ratings             -- Total number of ratings
      FROM promotion p
      LEFT JOIN promotion_images pi ON p.id = pi.promotion_id
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN ratings r ON p.id = r.promotion_id      -- Join ratings table
      GROUP BY p.id
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return callback(err);
      }
  
      const promotions = results.map((promo) => ({
        ...promo,
        images: promo.images ? promo.images.split(",") : [],  // Always return an array
        author: {
          username: promo.author_username || "Unknown",
          profilePhoto: promo.author_profile_photo || "/path/to/default-avatar.jpg",  // Fallback if no photo
        },
        status: promo.status || "Unknown",
        businessCertificateImage: promo.business_certificate_image || "/path/to/default-certificate.jpg",  // Fallback image
        averageRating: parseFloat(promo.average_rating).toFixed(2), // Ensure a consistent decimal format
        totalRatings: promo.total_ratings || 0, // Fallback if no ratings
      }));
  
      callback(null, promotions);
    });
  },
  

  createPromotion: (data, imageUrls, callback) => {
    const {
      title,
      description,
      start_date,
      end_date,
      destination,
      author_id,
      latitude,
      longitude,
      business_certificate,
    } = data;
  
    // Insert promotion details
    const promotionQuery = `
      INSERT INTO promotion (title, description, start_date, end_date, destination, author_id, latitude, longitude, business_certificate_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const promotionParams = [
      title,
      description,
      start_date,
      end_date,
      destination,
      author_id,
      latitude,
      longitude,
      business_certificate,
    ];
  
    db.query(promotionQuery, promotionParams, (err, result) => {
      if (err) return callback(err);
  
      const promotionId = result.insertId;
  
      // Handle promotion images
      if (imageUrls?.length) {
        const imageQuery = "INSERT INTO promotion_images (promotion_id, image_url) VALUES ?";
        const imageValues = imageUrls.map((url) => [promotionId, url]);
  
        db.query(imageQuery, [imageValues], (err) => {
          if (err) return callback(err);
          callback(null, promotionId);
        });
      } else {
        callback(null, promotionId);
      }
    });
  },
  
  updatePromotion: (id, data, imageUrls, callback) => {
    const { title, description, start_date, end_date } = data;
    db.query(
      "UPDATE promotion SET title = ?, description = ?, start_date = ?, end_date = ? WHERE id = ?",
      [title, description, start_date, end_date, id],
      (err) => {
        if (err) return callback(err);

        if (imageUrls && imageUrls.length) {
          db.query(
            "DELETE FROM promotion_images WHERE promotion_id = ?",
            [id],
            (err) => {
              if (err) return callback(err);

              const imageInserts = imageUrls.map((url) => [id, url]);
              db.query(
                "INSERT INTO promotion_images (promotion_id, image_url) VALUES ?",
                [imageInserts],
                (err) => {
                  if (err) return callback(err);
                  callback(null, true);
                }
              );
            }
          );
        } else {
          callback(null, true);
        }
      }
    );
  },

  deletePromotion: (id, callback) => {
    db.query("DELETE FROM promotion WHERE id = ?", [id], (err) => {
      if (err) return callback(err);
      callback(null, true);
    });
  },

  getAllApprovedPromotions(callback) {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.start_date, 
        p.end_date, 
        p.destination,
        p.business_certificate_image,
        p.status,
        IFNULL(GROUP_CONCAT(pi.image_url), '') AS images,
        u.username AS author_username, 
        u.profile_photo AS author_profile_photo
      FROM promotion p
      LEFT JOIN promotion_images pi ON p.id = pi.promotion_id
      LEFT JOIN users u ON p.author_id = u.user_id
      WHERE p.status = 'approved'  -- Fetch only approved promotions
      GROUP BY p.id
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        // Pass the error to the callback for proper handling
        return callback(err);
      }
  
      // If there are no results, return an empty array
      if (!results.length) {
        return callback(null, []);
      }
  
      const promotions = results.map((promo) => ({
        ...promo,
        images: promo.images ? promo.images.split(",") : [],  // Always return an array
        author: {
          username: promo.author_username || "Unknown",
          profilePhoto: promo.author_profile_photo || "/path/to/default-avatar.jpg",  // Fallback photo
        },
      }));
      callback(null, promotions);
    });
  },
  

  updatePromotionStatus(promotionId, status, callback) {
    const query = `
      UPDATE promotion
      SET status = ?
      WHERE id = ?
    `;
    
    db.query(query, [status, promotionId], (err, result) => {
      if (err) {
        return callback(err);
      }
      if (result.affectedRows === 0) {
        return callback(new Error("Promotion not found"));
      }
      callback(null, { message: "Promotion status updated successfully" });
    });
  }
};

Promotion.getPromotionsByAuthorId = (author_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.start_date, 
        p.end_date, 
        p.created_at, 
        p.updated_at, 
        p.destination, 
        p.latitude, 
        p.longitude,
        p.status,  -- Add the status field here
        u.username AS author_name,
        u.profile_photo AS author_photo,
        GROUP_CONCAT(pi.image_url) AS promotion_images
      FROM 
        promotion AS p
      JOIN 
        users AS u ON p.author_id = u.user_id
      LEFT JOIN 
        promotion_images AS pi ON p.id = pi.promotion_id
      WHERE 
        p.author_id = ?
      GROUP BY 
        p.id;
    `;

    db.query(query, [author_id], (err, results) => {
      if (err) {
        console.error("Error querying promotions by author:", err);
        return reject(err);
      }
      resolve(results);
    });
  });
};



Promotion.getPromotionById = (id, callback) => {
  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.start_date, 
      p.end_date, 
      p.destination, 
      p.latitude, 
      p.longitude, 
      IFNULL(GROUP_CONCAT(DISTINCT pi.image_url), '') AS images,
      u.username AS author_username, 
      u.profile_photo AS author_profile_photo,
      COUNT(DISTINCT c.comment_id) AS commentCount,  
      COUNT(DISTINCT l.like_id) AS likeCount       
    FROM promotion p
    LEFT JOIN comments c ON p.id = c.promotionid  
    LEFT JOIN likes l ON p.id = l.promotion_id          
    LEFT JOIN promotion_images pi ON p.id = pi.promotion_id
    LEFT JOIN users u ON p.author_id = u.user_id
    WHERE p.id = ?                                   
    GROUP BY 
      p.id, 
      p.title, 
      p.description, 
      p.start_date, 
      p.end_date, 
      p.destination, 
      p.latitude, 
      p.longitude, 
      u.username, 
      u.profile_photo;
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return callback(err);
    }

    if (!results.length) {
      console.warn("Promotion not found with ID:", id);
      return callback(null, null);
    }

    const result = results[0]; // Get the first row (grouped by promotion ID)

    const promotion = {
      id: result.id,
      title: result.title,
      description: result.description,
      start_date: result.start_date,
      end_date: result.end_date,
      destination: result.destination,
      latitude: result.latitude,
      longitude: result.longitude,
      images: result.images ? result.images.split(',') : [], // Split image URLs into an array
      author_username: result.author_username,
      author_profile_photo: result.author_profile_photo,
      commentCount: result.commentCount, // Include comment count
      likeCount: result.likeCount,       // Include like count
    };

    callback(null, promotion); // Pass the constructed promotion object to the callback
  });
};





module.exports = Promotion;
