// import axios from "./axios";

// // LOGIN
// export const loginApi = (email, password) => {
//   return axios.post(`/user/login/${encodeURIComponent(email)}/${encodeURIComponent(password)}`);
// };

// // SIGNUP
// export const signupApi = (data) => {
//   return axios.post("/user/signup", data);
// };

// // POST AD
// export const createAdApi = (data) => {
//   return axios.post("/ad/createAd", data);
// };

// // GET ADS BY USER
// export const getAdsByUserApi = (userId) => {
//   return axios.get(`/ad/GetAdsByUser/${userId}`);
// };

// // GET ALL ADS
// export const getAllAdsApi = () => {
//   return axios.get("/ad/GetAllAds");
// };

// // REGISTER VEHICLE
// export const registerVehicleApi = (data) => {
//   return axios.post("/vehicle/register", data);
// };

// // GET VEHICLES BY OWNER
// export const getVehiclesByOwnerApi = (ownerId) => {
//   return axios.get(`/vehicle/owner/${ownerId}`);
// };


// // GET AD SCHEDULE
// export const getScheduleApi = (adId) => {
//   return axios.get(`/adSchedule/getSchedule/${adId}`);
// };

// // SAVE AD SCHEDULE
// export const saveScheduleApi = (data) => {
//   return axios.post(`/adSchedule/save`, data);
// };

// // GET VEHICLE SCHEDULE
// export const getVehicleScheduleApi = (vehReg) => {
//   return axios.get(`/vehicleSchedule/get/${vehReg}`);
// };

// // SAVE VEHICLE SCHEDULE
// export const saveVehicleScheduleApi = (data) => {
//   return axios.post(`/vehicleSchedule/save`, data);
// };

// // GET ASSIGNMENTS 
// export const getAssignmentsApi=(adId)=>{
//   return axios.get(`/adassignment/byad/${adId}`);
// }

// // AD FENCE
// export const saveAdFenceApi = (data) => {
//   return axios.post("/adfence/addfence", data);
// };

// export const getAdFenceApi = (adId) => {
//   return axios.get(`/adfence/ad/${adId}`);
// };


// // VEHICLE FENCE
// export const saveVehicleFenceApi = (data) => {
//   return axios.post("/vehfence/addfence", data);
// };

// export const getVehicleFenceApi = (vehicleReg) => {
//   return axios.get(`/vehfence/vehicle/${vehicleReg}`);
// };


// // GET MATCHED DRIVERS
// export const getMatchedDriversApi = (adId) => {
//   return axios.post(`/adfence/matchdrivers4/${adId}`);
// };

// // REQUEST
// export const createRequestApi = (payload) => {
//   return axios.post("/request/create", payload);
// };

// export const getSentRequestsApi = (userId) => {
//   return axios.get(`/request/sent/${userId}`);
// };

// export const getReceivedRequestsApi = (userId) =>
//   axios.get(`/request/received/${userId}`);

// export const updateRequestStatusApi = (data) =>
//   axios.put(`/request/status`, data);

 
// // GET AGENCY BY USER ID 
// export const getAgencyByUserApi = (userId) =>
//   axios.get(`/agency/byuser/${userId}`);

// // GET AGENCY BY AGENCY ID
// export const getAgencyByIdApi = (agencyId) =>
//   axios.get(`/agency/byid/${agencyId}`);

// // GET VEHICLES LINKED WITH AGENCY
// export const getAgencyVehiclesApi = (agencyId) =>
//   axios.get(`/agency/vehicles/${agencyId}`);

// // GET ALL AGENCIES
// export const getAllAgenciesApi = () =>
//   axios.get("/agency/all");


// // LINK VEHICLE TO AGENCY
// export const linkVehicleToAgencyApi = (data) =>
//   axios.put("/agency/vehicle/link", data);


// // GET MATCHED AGENCIES
// export const getMatchedAgenciesApi = async (adId) => {
//   return axios.get(`/adfence/matchdrivers3/${adId}`);
// };

// // GET ACTIVE AD ASSIGNMENTS BY AGENCY
// export const getActiveAssignmentsByAgencyApi = (agencyId) =>
//   axios.get(`/adassignment/activebyagency/${agencyId}`);

// // GET AD ASSIGNMENT BY AD ID
// export const getAdAssignmentByAdApi = (adId) => {
//   return axios.get(`/adassignment/byad/${adId}`);
// };

// // GET FENCE BY VEHICLE
// export const getFenceByVehicleApi = (vehicleReg) => {
//   return axios.get(`/vehfence/vehicle/${vehicleReg}`);
// };

// // GET VEHICLE BY REGISTRATION NUMBER 
// export const getVehiclesByRegsApi = (regs) => {
//   return axios.post("/vehicle/byregs", regs);
// };

// // CHECK IF THE REQUEST EXISTS OR NOT
// export const checkRequestExistsApi = (data) => {
//   return axios.post("/request/exists", data);
// };

// // IS VEHICLE LINKED TO AGENCY? 
// export const isVehicleLinkedToAgencyApi = async (vehicleReg, agencyId) => {
//   return await axios.get(
//     `/agency/vehicle/isLinked?vehicleReg=${vehicleReg}&agencyId=${agencyId}`
//   );
// };

















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


// GET AD SCHEDULE
export const getScheduleApi = (adId) => {
  return axios.get(`/adSchedule/getSchedule/${adId}`);
};

// SAVE AD SCHEDULE
export const saveScheduleApi = (data) => {
  return axios.post(`/adSchedule/save`, data);
};

// GET VEHICLE SCHEDULE
export const getVehicleScheduleApi = (vehReg) => {
  return axios.get(`/vehicleSchedule/get/${vehReg}`);
};

// SAVE VEHICLE SCHEDULE
export const saveVehicleScheduleApi = (data) => {
  return axios.post(`/vehicleSchedule/save`, data);
};

// GET ASSIGNMENTS 
export const getAssignmentsApi=(adId)=>{
  return axios.get(`/adassignment/byad/${adId}`);
}

// AD FENCE
export const saveAdFenceApi = (data) => {
  return axios.post("/adfence/addfence", data);
};

export const getAdFenceApi = (adId) => {
  return axios.get(`/adfence/ad/${adId}`);
};


// VEHICLE FENCE
export const saveVehicleFenceApi = (data) => {
  return axios.post("/vehfence/addfence", data);
};

export const getVehicleFenceApi = (vehicleReg) => {
  return axios.get(`/vehfence/vehicle/${vehicleReg}`);
};


// GET MATCHED DRIVERS
export const getMatchedDriversApi = (adId) => {
  return axios.post(`/adfence/matchdrivers4/${adId}`);
};

// REQUEST
export const createRequestApi = (payload) => {
  return axios.post("/request/create", payload);
};

export const getSentRequestsApi = (userId) => {
  return axios.get(`/request/sent/${userId}`);
};

export const getReceivedRequestsApi = (userId) =>
  axios.get(`/request/received/${userId}`);

export const updateRequestStatusApi = (data) =>
  axios.put(`/request/status`, data);

 
// GET AGENCY BY USER ID 
export const getAgencyByUserApi = (userId) =>
  axios.get(`/agency/byuser/${userId}`);

// GET AGENCY BY AGENCY ID
export const getAgencyByIdApi = (agencyId) =>
  axios.get(`/agency/byid/${agencyId}`);

// GET VEHICLES LINKED WITH AGENCY
export const getAgencyVehiclesApi = (agencyId) =>
  axios.get(`/agency/vehicles/${agencyId}`);

// GET ALL AGENCIES
export const getAllAgenciesApi = () =>
  axios.get("/agency/all");


// LINK VEHICLE TO AGENCY
export const linkVehicleToAgencyApi = (data) =>
  axios.put("/agency/vehicle/link", data);


// GET MATCHED AGENCIES
export const getMatchedAgenciesApi = async (adId) => {
  return axios.get(`/adfence/matchdrivers3/${adId}`);
};

// GET ACTIVE AD ASSIGNMENTS BY AGENCY
export const getActiveAssignmentsByAgencyApi = (agencyId) =>
  axios.get(`/adassignment/activebyagency/${agencyId}`);

// GET AD ASSIGNMENT BY AD ID
export const getAdAssignmentByAdApi = (adId) => {
  return axios.get(`/adassignment/byad/${adId}`);
};

// GET FENCE BY VEHICLE
export const getFenceByVehicleApi = (vehicleReg) => {
  return axios.get(`/vehfence/vehicle/${vehicleReg}`);
};

// GET VEHICLE BY REGISTRATION NUMBER 
export const getVehiclesByRegsApi = (regs) => {
  return axios.post("/vehicle/byregs", regs);
};

// CHECK IF THE REQUEST EXISTS OR NOT
export const checkRequestExistsApi = (data) => {
  return axios.post("/request/exists", data);
};

// IS VEHICLE LINKED TO AGENCY? 
export const isVehicleLinkedToAgencyApi = async (vehicleReg, agencyId) => {
  return await axios.get(
    `/agency/vehicle/isLinked?vehicleReg=${vehicleReg}&agencyId=${agencyId}`
  );
};

export const saveDriverActivityLogApi = (payload) =>
  axios.post("/simulation/saveactivity", payload);

// ── GET  api/simulation/allocatedtime/{adId}
export const getAllocatedTimeApi = (adId) =>
  axios.get(`/simulation/allocatedtime/${adId}`);

// ── GET  api/simulation/analytics/{adId}
export const getAdAnalyticsApi = (adId) =>
  axios.get(`/simulation/analytics/${adId}`);

// ── GET  api/simulation/drivertrips/{driverId}
export const getDriverTripsApi = (driverId) =>
  axios.get(`/simulation/drivertrips/${driverId}`);
