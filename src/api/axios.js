import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost/MovingAdsBackend/api",
  headers: {
    "Content-Type": "application/json",
  },
});
// axios.get("/adSchedule/get/" + id);

export default instance;
