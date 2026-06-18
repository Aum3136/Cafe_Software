const express = require('express');
const router = express.Router();
const { placeOrder, listOrders, updateStatus } = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');

// Public — customer places an order (no JWT needed)
router.post('/', placeOrder);

// Protected — owner's kitchen queue and status updates
router.get('/',               authenticate, listOrders);
router.patch('/:id/status',   authenticate, updateStatus);

module.exports = router;
