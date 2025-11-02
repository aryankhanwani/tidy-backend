const supabase = require('../config/supabase');
const { validateRequiredFields } = require('../utils/validate');

/**
 * Get messages for the authenticated user
 * GET /api/messages/:userId
 */
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user.userId;

    // Verify user can only access their own messages
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view these messages'
      });
    }

    // Get all messages where the user is either sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: messages || []
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

/**
 * Get conversation between two users
 * GET /api/messages/conversation/:otherUserId
 */
const getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const authenticatedUserId = req.user.userId;

    // Get messages where user is sender and other is receiver
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', authenticatedUserId)
      .eq('receiver_id', otherUserId);

    if (sentError) {
      throw sentError;
    }

    // Get messages where user is receiver and other is sender
    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', otherUserId)
      .eq('receiver_id', authenticatedUserId);

    if (receivedError) {
      throw receivedError;
    }

    // Combine and sort messages
    const messages = [...(sentMessages || []), ...(receivedMessages || [])]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.status(200).json({
      success: true,
      data: messages || []
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

/**
 * Get list of users for chat (excluding current user)
 * GET /api/messages/users
 */
const getUsers = async (req, res) => {
  try {
    const authenticatedUserId = req.user.userId;
    console.log('Fetching users for authenticated user:', authenticatedUserId);

    // Get all profiles, excluding current user
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', authenticatedUserId)
      .order('name', { ascending: true });

    console.log('Supabase query result:', { profiles, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Returning profiles:', profiles?.length || 0);

    res.status(200).json({
      success: true,
      data: profiles || []
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * Send a new message
 * POST /api/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;
    const sender_id = req.user.userId;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['receiver_id', 'message']);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Validate message is not empty
    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Verify receiver exists
    const { data: receiverExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiver_id)
      .single();

    if (checkError || !receiverExists) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Prevent sending message to self
    if (sender_id === receiver_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert([{
        sender_id,
        receiver_id,
        message: message.trim()
      }])
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

module.exports = {
  getMessages,
  getConversation,
  getUsers,
  sendMessage
};

