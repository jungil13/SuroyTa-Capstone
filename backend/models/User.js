const db = require('../config/db');

class User {
  static register(username, email, password, profilePhoto, userType, callback) {
    const sql = 'INSERT INTO users (username, email, password, profile_photo, user_type) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [username, email, password, profilePhoto, userType], callback);
}

  static findByUsername(username, callback) {
    // Add 'is_restricted' to the selected fields
    const sql = 'SELECT user_id, username, email, password, profile_photo, user_type, is_restricted FROM users WHERE username = ?';
    db.query(sql, [username], callback);
  }
  

  static findByEmail(email, callback) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], callback); // Query by email instead of username
  }
  
  static async create({ email, username, profilePhoto, user_type }) {
    const sql = 'INSERT INTO users (email, username, profile_photo, user_type) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [email, username, profilePhoto, user_type]);
    return { user_id: result.insertId, email, username, profilePhoto, user_type };
  }

  
static findById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    db.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}


static getAllBios(callback) {
  const sql = 'SELECT user_id, bio FROM users WHERE bio IS NOT NULL';
  db.query(sql, callback);
}



static async getBioById(userId) {
  const [rows] = await db.execute('SELECT user_id, bio FROM users WHERE user_id = ? AND bio IS NOT NULL', [userId]);
  return rows[0]; // Return the first row (the user's bio)
}

static updateProfile(id, username, email, profilePhoto, password) {
  return new Promise((resolve, reject) => {
      // Start building the SQL query
      let sql = 'UPDATE users SET ';
      const params = [];

      // Check which fields are provided and add them to the query
      if (username) {
          sql += 'username = ?, ';
          params.push(username);
      }
      if (email) {
          sql += 'email = ?, ';
          params.push(email);
      }
      if (profilePhoto) {
          sql += 'profile_photo = ?, ';
          params.push(profilePhoto);
      }
      if (password) {
          sql += 'password = ?, '; // Ensure you hash the password before saving
          params.push(password); // You should hash the password here
      }

      // Remove the last comma and space
      sql = sql.slice(0, -2);
      sql += ' WHERE user_id = ?';
      params.push(id); // Add the user ID to the parameters

      db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
      });
  });
}


static async getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT username, email, profile_photo, bio FROM users WHERE user_id = ?',
      [userId],
      (error, results) => {
        if (error) {
          console.error('Error executing query:', error);
          return reject(error); // Reject the promise with the error
        }
        resolve(results[0]); // Resolve with the user object, including the bio
      }
    );
  });
}


}

module.exports = User;
