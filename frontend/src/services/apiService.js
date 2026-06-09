/**
 * API Service wrapper.
 * 
 * Provides centralized async HTTP functions to upload files, retrieve user medical
 * records, update clinical data elements, and generate expiring shared links.
 */

import axios from 'axios';

// Base backend URL config (port 8000 for FastAPI)
const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  /**
   * Uploads a file (PDF, DICOM, image) as multipart form data.
   * 
   * @param {File} file - The file to upload.
   * @returns {Promise<Object>} The parsed record observations.
   */
  uploadRecord: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Fetches all medical records for the user.
   * 
   * @returns {Promise<Array>} Chronological list of records.
   */
  getRecords: async () => {
    const response = await api.get('/records');
    return response.data;
  },

  /**
   * Fetches details of a single record.
   * 
   * @param {number} id - Record identifier.
   * @returns {Promise<Object>} Record details.
   */
  getRecord: async (id) => {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },

  /**
   * Updates clinical values for a record.
   * 
   * @param {number} id - Record identifier.
   * @param {Object} data - Schema elements to update.
   * @returns {Promise<Object>} The updated record.
   */
  updateRecord: async (id, data) => {
    const response = await api.put(`/records/${id}`, data);
    return response.data;
  },

  /**
   * Deletes a record from the database.
   * 
   * @param {number} id - Record identifier.
   * @returns {Promise<Object>} Success message.
   */
  deleteRecord: async (id) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  /**
   * Generates a temporary sharing link.
   * 
   * @param {Array<number>} recordIds - List of records to share.
   * @param {number} expiryHours - Time until expiration.
   * @param {string} [passcode] - Security key (optional).
   * @returns {Promise<Object>} Sharing link configuration metadata.
   */
  generateShareLink: async (recordIds, expiryHours, passcode) => {
    const payload = {
      record_ids: recordIds,
      expiry_hours: expiryHours,
      passcode: passcode || undefined,
    };
    const response = await api.post('/sharing/generate', payload);
    return response.data;
  },

  /**
   * Retrieves shared records through a guest link token.
   * 
   * @param {string} token - The link UUID key.
   * @param {string} [passcode] - The authentication passcode.
   * @returns {Promise<Array>} Shared records list.
   */
  getSharedRecords: async (token, passcode) => {
    const params = passcode ? { passcode } : {};
    const response = await api.get(`/sharing/${token}`, { params });
    return response.data;
  },

  /**
   * Returns the raw URL to download/view the file payload.
   * 
   * @param {number} id - The record identifier.
   * @returns {string} The direct download API endpoint.
   */
  getFileUrl: (id) => {
    return `${BASE_URL}/records/${id}/file`;
  },

  /* ── AI Summarization ──────────────────────────── */

  /**
   * Generates an AI summary for a specific record.
   *
   * @param {number} recordId - Record identifier.
   * @returns {Promise<Object>} The generated summary.
   */
  generateSummary: async (recordId) => {
    const response = await api.post(`/ai/summarize/${recordId}`);
    return response.data;
  },

  /**
   * Retrieves an existing AI summary for a record.
   *
   * @param {number} recordId - Record identifier.
   * @returns {Promise<Object>} The stored summary.
   */
  getSummary: async (recordId) => {
    const response = await api.get(`/ai/summary/${recordId}`);
    return response.data;
  },

  /* ── AI Chat ───────────────────────────────────── */

  /**
   * Sends a message to the AI chat assistant.
   *
   * @param {string|null} conversationId - Existing conversation ID or null for new.
   * @param {string} message - The user message text.
   * @returns {Promise<Object>} The assistant response with conversation_id, message, and citations.
   */
  sendChatMessage: async (conversationId, message) => {
    const response = await api.post('/ai/chat', {
      conversation_id: conversationId || undefined,
      message: message,
    });
    return response.data;
  },

  /**
   * Fetches all chat conversations.
   *
   * @returns {Promise<Array>} List of conversations.
   */
  getConversations: async () => {
    const response = await api.get('/ai/chat/conversations');
    return response.data;
  },

  /**
   * Fetches a single conversation with all messages.
   *
   * @param {string} id - Conversation identifier.
   * @returns {Promise<Object>} Full conversation with messages.
   */
  getConversation: async (id) => {
    const response = await api.get(`/ai/chat/conversations/${id}`);
    return response.data;
  },

  /**
   * Deletes a chat conversation.
   *
   * @param {string} id - Conversation identifier.
   * @returns {Promise<Object>} Success confirmation.
   */
  deleteConversation: async (id) => {
    const response = await api.delete(`/ai/chat/conversations/${id}`);
    return response.data;
  },

  /* ── Recommendations ───────────────────────────── */

  /**
   * Fetches AI-generated health recommendations.
   *
   * @returns {Promise<Array>} List of recommendation objects.
   */
  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },

  /**
   * Regenerates health recommendations from all records.
   *
   * @returns {Promise<Array>} Freshly generated recommendations.
   */
  regenerateRecommendations: async () => {
    const response = await api.post('/ai/recommendations/generate');
    return response.data;
  },

  /* ── Semantic Search ────────────────────────────── */

  /**
   * Performs semantic search across medical records.
   *
   * @param {string} query - Natural language search query.
   * @param {Object} filters - Optional filters (date_from, date_to, category, doctor).
   * @returns {Promise<Array>} Matching record chunks with similarity scores.
   */
  semanticSearch: async (query, filters = {}) => {
    const response = await api.post('/ai/search', { query, ...filters });
    return response.data;
  },
};
