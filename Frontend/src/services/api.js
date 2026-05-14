import axios from "axios";

const API = axios.create({
baseURL: "https://stock-price-prediction-46mf.onrender.com"
});

export default API;
