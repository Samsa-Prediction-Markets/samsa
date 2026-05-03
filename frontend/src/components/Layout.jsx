import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      <Sidebar />
      <div className="main-content" style={{ background: 'rgb(2, 6, 23)' }}>
        <Outlet />
      </div>
    </>
  );
}
