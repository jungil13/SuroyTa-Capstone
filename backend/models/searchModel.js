const db = require('../config/db');

const searchByDestination = async (destination) => {
  const postsQuery = `
    SELECT post_id, user_id, title, created_at, content, category_id, image_url, likes, views, destination, latitude, longitude
    FROM posts
    WHERE destination LIKE ? AND hidden = 0
  `;

  const promotionsQuery = `
    SELECT p.id, p.title, p.description, p.start_date, p.end_date, p.created_at, p.updated_at, p.destination, p.author_id, p.latitude, p.longitude, p.status, pi.image_url
    FROM promotion p
    LEFT JOIN promotion_images pi ON p.id = pi.promotion_id
    WHERE p.destination LIKE ?
  `;

  const [posts] = await db.promise().query(postsQuery, [`%${destination}%`]);
  const [promotions] = await db.promise().query(promotionsQuery, [`%${destination}%`]);

  return { posts, promotions };
};

module.exports = { searchByDestination };
