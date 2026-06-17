const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/itemController');
const { authenticate } = require('../middlewares/auth');

// All item management routes are protected — owner only
router.get('/',     authenticate, list);
router.post('/',    authenticate, create);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
