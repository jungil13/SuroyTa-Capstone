const searchModel = require('../models/searchModel');

const search = async (req, res) => {
  const { destination } = req.query;

  if (!destination) {
    return res.status(400).json({ message: 'Destination is required.' });
  }

  try {
    const results = await searchModel.searchByDestination(destination);

    res.status(200).json({
      message: 'Search results fetched successfully.',
      data: results,
    });
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ message: 'Error fetching search results.' });
  }
};

module.exports = { search };
