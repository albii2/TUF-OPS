
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOwnerDashboardData = async () => {
  try {
    const response = await apiClient.get('/reporting/owner');
    return response.data;
  } catch (error) {
    console.error('Error fetching owner dashboard data:', error);
    throw error;
  }
};

export const getOrganizationById = async (id: string) => {
  try {
    const response = await apiClient.get(`/organizations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching organization with id ${id}:`, error);
    throw error;
  }
};
