import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="bg-background text-foreground h-full w-full flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <div className="max-w-7xl mx-auto w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
