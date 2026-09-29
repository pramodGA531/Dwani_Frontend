import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="bg-background text-foreground h-full w-full flex overflow-hidden print:overflow-visible print:h-auto print:block">
      <div className="print:hidden h-full flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 print:overflow-visible print:h-auto print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6 print:overflow-visible print:p-0 print:h-auto print:block">
          <div className="max-w-7xl mx-auto w-full max-w-full print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
