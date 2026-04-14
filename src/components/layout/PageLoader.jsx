import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const PageLoader = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="loader-container">
      <div className="spinner"></div>
    </div>
  );
};

export default PageLoader;
