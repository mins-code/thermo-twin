import axios from 'axios';

const API_BASE_URL = 'http://localhost:5050/api';

export const getTwinState = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/state`);
    return response.data;
  } catch (error) {
    console.error("Error fetching twin state:", error);
    throw error;
  }
};

export const updateControls = async (controls) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/controls`, controls);
    return response.data;
  } catch (error) {
    console.error("Error updating controls:", error);
    throw error;
  }
};
