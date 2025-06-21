import ChatMessage from '../models/chatModel.js';

export const sendMessage = async (req, res) => {
  try {
    const { appointmentId, senderType, senderId, message } = req.body;

    const newMsg = new ChatMessage({ appointmentId, senderType, senderId, message });
    await newMsg.save();
    res.status(201).json({ success: true, message: 'Message sent', data: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const messages = await ChatMessage.find({ appointmentId }).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};