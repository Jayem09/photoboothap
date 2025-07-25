'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from "../../components/ui/Button";

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push('/login');
      } else {
        const data = await response.json();
        // The original code had a setError(data.error || 'An error occurred'); line,
        // but the user's edit removed the 'error' state.
        // Assuming the intent was to remove the error display if 'error' state is removed.
        // However, the user's edit only removed the 'error' state declaration.
        // To strictly follow the user's edit, I will remove the line.
      }
    } catch (error) {
      // The original code had a setError('An error occurred'); line,
      // but the user's edit removed the 'error' state.
      // Assuming the intent was to remove the error display if 'error' state is removed.
      // However, the user's edit only removed the 'error' state declaration.
      // To strictly follow the user's edit, I will remove the line.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-pink-50 font-sans">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-white flex flex-col items-center">
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-100 mb-4">
          <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8zm6 8v-2a6 6 0 00-12 0v2" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-pink-500 mb-1">Create your account</h2>
        <p className="text-gray-500 mb-6 text-sm">Join and start your journey!</p>
        {/* The error display block was removed as per the user's edit. */}
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-gray-700 placeholder-pink-300 transition"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-gray-700 placeholder-pink-300 transition"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            label={loading ? 'Creating account...' : 'Sign Up'}
            onClick={() => {}}
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-4"
          />
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="text-pink-400 hover:underline text-sm font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}