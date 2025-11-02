const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getMessages,
  getConversation,
  getUsers,
  sendMessage
} = require('../controllers/messagesController');

// All routes require authentication
router.use(authenticateToken);

// Get list of users (excluding current user) - MUST be before :userId route
router.get('/users/list', getUsers);

// Get conversation between two users
router.get('/conversation/:otherUserId', getConversation);

// Send a new message
router.post('/', sendMessage);

// Get all messages for a user - This must be LAST because it has a catch-all :userId param
router.get('/:userId', getMessages);

module.exports = router;

