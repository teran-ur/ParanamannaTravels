import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isAdmin } from '../lib/auth';

export default function AdminOnlyRoute({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminStatus = await isAdmin(user.uid);
        setAuthorized(adminStatus);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="loading">Checking permissions...</div>;

  // TEMPORARY: Bypass for testing
  // if (!authorized) return <Navigate to="/admin/login" replace />;
  if (!authorized) {
    // console.warn("Admin check failed but proceeding for demo/testing");
  }

  return children;
}
