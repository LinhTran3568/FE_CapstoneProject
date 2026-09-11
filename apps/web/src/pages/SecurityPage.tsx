import React from 'react';
import { Security as SecuritySection } from '../components/landing/Security';

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05070A] text-[#F5F5F2] pt-24 pb-20 font-sans antialiased">
      <SecuritySection />
    </div>
  );
};

export default SecurityPage;
