import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
// import ApplicationRoadmap from './ApplicationRoadmap';

const LayoutWrapper = ({ children, title, breadcrumbs, maxWidthClass = "max-w-7xl", currentStep }) => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FF] font-sans text-slate-800 pb-24 lg:pb-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} />
        
        {/* {currentStep && <ApplicationRoadmap currentStep={currentStep} />} */}
        
        <main className="flex-1 w-full px-6 py-6">
          <div className={`${maxWidthClass} mx-auto space-y-6`}>
            {children}
            
            {/* Common Footer across dashboard layouts */}
            <footer className="pt-10 pb-4 flex justify-center gap-6 text-sm text-slate-400 font-medium">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <span className="text-slate-300">|</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              <span className="text-slate-300">|</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Candidate Support</a>
            </footer>
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
};

export default LayoutWrapper;

