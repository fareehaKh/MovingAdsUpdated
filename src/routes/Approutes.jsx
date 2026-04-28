import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../screens/auth/Login";
import Signup from "../screens/auth/Signup";
import AdvertiserDashboard from "../screens/dashboard/AdvertiserDashboard";
import DriverDashboard from "../screens/dashboard/DriverDashboard";
import { getUserSession } from "../utils/session";
import NewAdOpportunities from "../screens/driver/NewAdOpportunities";
import RequestsToDriver from "../screens/driver/RequestsToDriver";
import ScheduleScreen from "../screens/schedule/AdScheduleScreen";
import LocationScreen from "../screens/location/LocationScreen";
import VehScheduleScreen from "../screens/schedule/VehScheduleScreen";
import VehLocationScreen from "../screens/location/VehLocationScreen";
import MatchDrivers from "../screens/advertiser/MatchDrivers";
import SentRequests from "../screens/advertiser/SentRequests";
import AdSimulationScreen from "../screens/driver/AdSimulationScreen";

// Protect routes: redirect to login if not logged in, or wrong role
const ProtectedRoute = ({ element, requiredRole }) => {
  const user = getUserSession();
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard
    return <Navigate to={user.role === "a" ? "/advertiser" : "/driver"} replace />;
  }
  return element;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/advertiser"
          element={<ProtectedRoute element={<AdvertiserDashboard />} requiredRole="a" />}
        />
        <Route
          path="/driver"
          element={<ProtectedRoute element={<DriverDashboard />} requiredRole="d" />}
        />

        <Route
          path="/driver/new-ad-opportunities"
          element={<NewAdOpportunities />}
        />

        {/* SCHEDULE ROUTES */}
        <Route
          path="/schedule/ad-schedule-screen/:adId"
          element={<ScheduleScreen />}
        />

        <Route
          path="/schedule/veh-schedule-screen/:vehReg"
          element={<VehScheduleScreen />}
        />

        {/* FENCE ROUTES */}
        <Route
          path="/location/ad-location-screen/:adId"
          element={<LocationScreen />}
        />

        <Route
          path="/location/veh-location-screen/:vehReg"
          element={<VehLocationScreen />}
        />

        {/* REQUESTS ROUTES */}
        <Route
          path="/driver/requests-to-driver"
          element={<RequestsToDriver />}
        />

        <Route
          path="/advertiser/find-drivers/:adId"
          element={<MatchDrivers />}
        />

        <Route
          path="/advertiser/sent-requests/"
          element={<SentRequests />}
        />

    <Route
          path="/driver/ad-simulation/"
          element={<AdSimulationScreen />}
        />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
