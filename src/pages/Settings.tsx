import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import UserBanner from '@components/Auth/UserBanner';

/** Settings admin page */
const Settings = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <UserBanner />
      <div className="p-4 text-white">
        <h1 className="text-xl mb-4">Admin Settings</h1>
        <p>Configuration options will appear here.</p>
      </div>
    </>
  );
};

export default Settings;
