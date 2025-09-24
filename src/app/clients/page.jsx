'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../services/authApi';

export default function ClientPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the user token from cookies
    const userToken = getToken();
    
    if (!userToken) {
      // If no token, redirect to sign-in
      router.push('/sign-in');
      return;
    }

    // Construct the external URL with the token
    const externalUrl = `https://preview--law-fluent-ai.lovable.app/?token=${userToken}`;
    
    console.log('🔗 Redirecting to external client:', externalUrl);
    
    // Redirect to the external URL
    window.location.href = externalUrl;
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirecting to client application...</p>
      </div>
    </div>
  );
} 