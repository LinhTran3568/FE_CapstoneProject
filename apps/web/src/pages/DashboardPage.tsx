import React from 'react';
import { Navigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return <Navigate to="/" replace />;
};

export default DashboardPage;
