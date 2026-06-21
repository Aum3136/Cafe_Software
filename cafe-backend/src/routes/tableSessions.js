const express = require('express');
const router = express.Router();
const { getSession, addItem, removeItem } = require('../controllers/tableSessionController');

// Public endpoints (no auth, validated by cafe slug and table number)
router.get('/:cafeSlug/:tableNumber', getSession);
router.post('/:cafeSlug/:tableNumber/items', addItem);
router.delete('/:cafeSlug/:tableNumber/items/:itemId', removeItem);

module.exports = router;
