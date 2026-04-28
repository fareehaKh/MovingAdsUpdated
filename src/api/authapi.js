import axios from "./axios";

// LOGIN
export const loginApi = (email, password) => {
  return axios.post(`/user/login/${encodeURIComponent(email)}/${encodeURIComponent(password)}`);
};

// SIGNUP
export const signupApi = (data) => {
  return axios.post("/user/signup", data);
};

// POST AD
export const createAdApi = (data) => {
  return axios.post("/ad/createAd", data);
};

// GET ADS BY USER
export const getAdsByUserApi = (userId) => {
  return axios.get(`/ad/GetAdsByUser/${userId}`);
};

// GET ALL ADS
export const getAllAdsApi = () => {
  return axios.get("/ad/GetAllAds");
};

// REGISTER VEHICLE
export const registerVehicleApi = (data) => {
  return axios.post("/vehicle/register", data);
};

// GET VEHICLES BY OWNER
export const getVehiclesByOwnerApi = (ownerId) => {
  return axios.get(`/vehicle/owner/${ownerId}`);
};


// AD SCHEDULE
export const getScheduleApi = (adId) => {
  return axios.get(`/adSchedule/getSchedule/${adId}`);
};

export const saveScheduleApi = (data) => {
  return axios.post(`/adSchedule/save`, data);
};

// VEHICLE SCHEDULE
export const getVehicleScheduleApi = (vehReg) => {
  return axios.get(`/vehicleSchedule/get/${vehReg}`);
};

export const saveVehicleScheduleApi = (data) => {
  return axios.post(`/vehicleSchedule/save`, data);
};

export const getAssignmentsApi=(adId)=>{
  return axios.get(`/adassignment/byad/${adId}`);
}

// =============================
// AD FENCE
// =============================

export const saveAdFenceApi = (data) => {
  return axios.post("/adfence/addfence", data);
};

export const getAdFenceApi = (adId) => {
  return axios.get(`/adfence/ad/${adId}`);
};


// =============================
// VEHICLE FENCE
// =============================

export const saveVehicleFenceApi = (data) => {
  return axios.post("/vehfence/addfence", data);
};

export const getVehicleFenceApi = (vehicleReg) => {
  return axios.get(`/vehfence/vehicle/${vehicleReg}`);
};


// ✅ MATCHED DRIVERS
export const getMatchedDriversApi = (adId) => {
  return axios.post(`/adfence/matchdrivers4/${adId}`);
};

// ✅  REQUEST
export const createRequestApi = (payload) => {
  return axios.post("/request/create", payload);
};

export const getReceivedRequestsApi = (userId) =>
  axios.get(`/request/received/${userId}`);

export const updateRequestStatusApi = (data) =>
  axios.put(`/request/status`, data);


export const getFenceByVehicleApi = (vehicleReg) => {
  return axios.get(`/vehfence/vehicle/${vehicleReg}`);
};


export const getVehiclesByRegsApi = (regs) => {
  return axios.post("/vehicle/byregs", regs);
};

export const checkRequestExistsApi = (data) => {
  return axios.post("/request/exists", data);
};

export const getSentRequestsApi = (userId) => {
  return axios.get(`/request/sent/${userId}`);
};




