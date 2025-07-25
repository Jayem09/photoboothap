'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from "../../components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-pink-50 font-sans">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-white flex flex-col items-center">
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-100 mb-4">
          <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-pink-500 mb-1">Welcome Back</h2>
        <p className="text-gray-500 mb-6 text-sm">Sign in to continue your journey</p>
        {error && (
          <div className="text-pink-600 text-center bg-pink-100 border border-pink-200 rounded-xl p-3 w-full mb-2 text-sm">
            {error}
          </div>
        )}
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
            className="w-full px-4 py-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-gray-700 placeholder-pink-300 transition"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            label={loading ? 'Signing you in...' : 'Sign In'}
            onClick={() => {}}
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-4"
          />
        </form>
        <div className="text-center mt-4">
          <Link href="/signup" className="text-pink-400 hover:underline text-sm font-medium">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
