const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/getallpromotions', promotionController.getAllPromotions);
router.get('/getallpromotions/:id', promotionController.getPromotionById);
router.post('/', promotionController.uploadMiddleware, authenticateToken, promotionController.createPromotion);
router.get('/getallpromotions/author/:author_id',authenticateToken,  promotionController.getPromotionsByAuthorId);
router.get('/getallapprovedpromotions', promotionController.getAllApprovedPromotions);

router.put('/updatepromotionstatus/:id', authenticateToken, promotionController.updatePromotionStatus);

module.exports = router;
