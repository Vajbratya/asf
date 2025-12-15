'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Redirect to WorkOS authorization URL
      window.location.href = '/api/auth/login';
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleLogin} disabled={loading} className="w-full" size="lg">
        {loading ? 'Signing in...' : 'Sign in with SSO'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground dark:bg-gray-800">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/api/auth/login?provider=google')}
          disabled={loading}
        >
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/api/auth/login?provider=microsoft')}
          disabled={loading}
        >
          Microsoft
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        SSO-ready authentication powered by WorkOS
      </p>
    </div>
  );
}
