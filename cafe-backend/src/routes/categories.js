const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth');

router.get('/',       authenticate, list);
router.post('/',      authenticate, create);
router.patch('/:id',  authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
