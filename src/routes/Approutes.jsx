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
import RouteScreen from "../screens/location/RouteScreen";
import AgencyDashboard from "../screens/dashboard/AgencyDashboard";
import AvailableAgencies from "../screens/driver/AvailableAgencies";
import LinkedDrivers from "../screens/agency/LinkedDrivers";
import ReceiveRequests from "../screens/agency/ReceivedRequests";
import ReceivedRequests from "../screens/agency/ReceivedRequests";
import FindAgencies from "../screens/advertiser/FindAgencies";
import AdSimulationMap from "../screens/agency/AdSimulationMap";
import AdSimulationForm from "../screens/agency/AdSimulationForm";
import TripStatsScreen from "../screens/driver/TripStatsScreen";
import AdStatsScreen from "../screens/advertiser/AdStatsScreen";
import AgencyAnalyticsScreen from "../screens/agency/AgencyAnalyticsScreen";
import AdvertiserBillingScreen from "../screens/advertiser/AdvertiserBilling";
import DriverBillingScreen from "../screens/driver/DriverBillingScreen";
import AgencyBillingScreen from "../screens/agency/AgencyBillingScreen";

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
          path="/agency"
          element={<ProtectedRoute element={<AgencyDashboard />} requiredRole="g" />}
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
          path="/location/ad-route-screen/:adId"
          element={<RouteScreen />}
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
          path="/advertiser/ad-billing/"
          element={<AdvertiserBillingScreen />}
        />

        <Route
          path="/driver/earnings/"
          element={<DriverBillingScreen />}
        />

         <Route
          path="/agency/billing/:agencyId"
          element={<AgencyBillingScreen />}
        />

        <Route
          path="/driver/ad-simulation/"
          element={<AdSimulationScreen />}
        />

        <Route
          path="/driver/available-agencies/"
          element={<AvailableAgencies />}
        />

        <Route
          path="/agency/linked-drivers/"
          element={<LinkedDrivers />}
        />

        <Route
          path="/agency/received-requests/"
          element={<ReceivedRequests />}
        />

        <Route
          path="/advertiser/find-agencies/:adId"
          element={<FindAgencies />}
        />

        {/* SIMULATION SCREEN */}
        <Route
          path="/agency/ad-simulation-form"
          element={<AdSimulationForm />}
        />

        <Route
          path="/agency/ad-simulation-map"
          element={<AdSimulationMap />}
        />

        {/* <Route
          path="/agency/simulate-ads-button"
          element={<SimulateAdsButton />}
        /> */}

        <Route
          path="/driver/trip-stats/:vehicleReg"
          element={<TripStatsScreen />}
        />

        <Route
          path="/advertiser/ad-stats"
          element={<AdStatsScreen />}
        />

        <Route
          path="/agency/agency-analytics/:adId"
          element={<AgencyAnalyticsScreen />}
        />

        




        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
