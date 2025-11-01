'use client';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing in as guest", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Login</h1>
      <div className="flex flex-col gap-4">
        <button onClick={handleGoogleLogin} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Login with Google
        </button>
        <button onClick={handleGuestLogin} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
