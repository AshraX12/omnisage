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
};
