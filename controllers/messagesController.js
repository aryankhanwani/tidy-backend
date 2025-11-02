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

    // Get messages where user is sender and other is receiver (not deleted for sender)
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', authenticatedUserId)
      .eq('receiver_id', otherUserId)
      .eq('deleted_for_sender', false);

    if (sentError) {
      throw sentError;
    }

    // Get messages where user is receiver and other is sender (not deleted for receiver)
    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', otherUserId)
      .eq('receiver_id', authenticatedUserId)
      .eq('deleted_for_receiver', false);

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
 * 
 * Access Rules:
 * - Housekeepers can see ALL owners
 * - Owners can see ALL other owners and housekeepers they have messaged with
 */
const getUsers = async (req, res) => {
  try {
    const authenticatedUserId = req.user.userId;
    console.log('Fetching users for authenticated user:', authenticatedUserId);

    // First, get the current user's role
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .single();

    if (profileError || !currentProfile) {
      throw new Error('Could not find user profile');
    }

    const currentUserRole = currentProfile.role;

    let profiles = [];

    if (currentUserRole === 'housekeeper') {
      // Housekeepers can see ALL owners
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'owner')
        .neq('user_id', authenticatedUserId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      profiles = data || [];
    } else if (currentUserRole === 'owner') {
      // Owners can see ALL other owners
      // Get all owners first
      const { data: allOwners, error: ownersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'owner')
        .neq('user_id', authenticatedUserId)
        .order('name', { ascending: true });

      if (ownersError) {
        throw ownersError;
      }

      // Get housekeepers they have messaged with
      // Get all users who have messaged with this owner OR have received messages from this owner
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${authenticatedUserId},receiver_id.eq.${authenticatedUserId}`);

      if (messageError) {
        throw messageError;
      }

      // Extract unique user IDs that the owner has conversed with
      const conversedUserIds = new Set();
      if (messageData) {
        messageData.forEach(msg => {
          if (msg.sender_id === authenticatedUserId) {
            conversedUserIds.add(msg.receiver_id);
          } else if (msg.receiver_id === authenticatedUserId) {
            conversedUserIds.add(msg.sender_id);
          }
        });
      }

      // Get profiles of housekeepers that the owner has conversed with
      let conversedHousekeepers = [];
      if (conversedUserIds.size > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'housekeeper')
          .in('user_id', Array.from(conversedUserIds))
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }
        conversedHousekeepers = data || [];
      }

      // Combine all owners with housekeepers they've conversed with
      profiles = [...(allOwners || []), ...conversedHousekeepers];
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

    // Get sender's role to enforce access rules
    const { data: senderProfile, error: senderProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', sender_id)
      .single();

    if (senderProfileError || !senderProfile) {
      return res.status(400).json({
        success: false,
        message: 'Sender profile not found'
      });
    }

    const senderRole = senderProfile.role;

    // If sender is owner, apply messaging restrictions
    if (senderRole === 'owner') {
      // Get receiver's role
      const { data: receiverProfile, error: receiverProfileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', receiver_id)
        .single();

      if (receiverProfileError || !receiverProfile) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      // Owners can message other owners freely, but need existing conversation for housekeepers
      // If owner is trying to message a housekeeper, verify there's existing conversation
      if (receiverProfile.role === 'housekeeper') {
        // Check if there's any message between these two users
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select('id')
          .eq('sender_id', sender_id)
          .eq('receiver_id', receiver_id)
          .limit(1);

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('id')
          .eq('sender_id', receiver_id)
          .eq('receiver_id', sender_id)
          .limit(1);

        if (sentError || receivedError) {
          throw sentError || receivedError;
        }

        // Only allow if there's an existing conversation (housekeeper initiated or previous messages)
        const hasConversation = (sentMessages && sentMessages.length > 0) || 
                                (receivedMessages && receivedMessages.length > 0);

        if (!hasConversation) {
          return res.status(403).json({
            success: false,
            message: 'You can only message housekeepers who have messaged you first'
          });
        }
      }
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

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const authenticatedUserId = req.user.userId;
    const { deleteForEveryone } = req.body;

    // Get the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user has permission (must be sender or receiver)
    if (message.sender_id !== authenticatedUserId && message.receiver_id !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this message'
      });
    }

    if (deleteForEveryone === true) {
      // Only sender can delete for everyone
      if (message.sender_id !== authenticatedUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender can delete messages for everyone'
        });
      }

      // Delete for everyone - mark as deleted for both
      const { error: deleteError } = await supabase
        .from('messages')
        .update({
          deleted_for_sender: true,
          deleted_for_receiver: true
        })
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      // Delete for me only
      const updateData = {};
      if (message.sender_id === authenticatedUserId) {
        updateData.deleted_for_sender = true;
      } else {
        updateData.deleted_for_receiver = true;
      }

      const { error: deleteError } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }
    }

    res.status(200).json({
      success: true,
      message: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted for you'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

module.exports = {
  getMessages,
  getConversation,
  getUsers,
  sendMessage,
  deleteMessage
};
