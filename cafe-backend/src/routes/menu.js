const express = require('express');
const router = express.Router();
const { publicMenu } = require('../controllers/itemController');

// GET /api/menu/:slug  — no authentication, publicly accessible
router.get('/:slug', publicMenu);

module.exports = router;
