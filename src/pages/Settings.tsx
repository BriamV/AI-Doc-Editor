import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import UserBanner from '@components/Auth/UserBanner';
import UsageLimitsConfig from '@components/admin/UsageLimitsConfig';

/** Settings admin page (T-03 ST3: Usage Limits Admin UI) */
const Settings = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <UserBanner />
      <div className="p-8 text-white max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

        {/* T-03 ST3: Usage Limits Configuration Section */}
        <UsageLimitsConfig />
      </div>
    </>
  );
};

export default Settings;
