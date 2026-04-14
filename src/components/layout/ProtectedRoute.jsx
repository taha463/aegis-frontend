import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ userRole, requiredRole, children }) => {
  // 1. If no role is found, the user isn't logged in
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. If the role doesn't match the dashboard (e.g., Citizen trying to open NGO)
  if (userRole !== requiredRole) {
    const fallback = userRole === "ngo" ? "/DashboardNGO" : "/DashboardCitizen";
    return <Navigate to={fallback} replace />;
  }

  // 3. If everything is correct, show the dashboard
  return children;
};

export default ProtectedRoute;