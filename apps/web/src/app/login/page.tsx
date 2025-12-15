import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const session = await getSession();

  // If already logged in, redirect to home
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              IntegraSaúde
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Healthcare Integration Platform</p>
          </div>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
