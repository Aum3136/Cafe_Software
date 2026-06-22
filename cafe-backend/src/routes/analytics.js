const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

// GET /api/analytics?range=today|7d|30d|all
// Protected — owner only, scoped to their cafe_id via JWT
router.get('/', authenticate, getAnalytics);

module.exports = router;
