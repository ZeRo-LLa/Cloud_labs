import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5005',
});

export const getProducts = async (engine = "") => {
  const params = {};
  if (engine && engine !== "All") {
    params.engine = engine;
  }

  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};