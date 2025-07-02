import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/update-password`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Magic link sent! Please check your email.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login to RBC Bar Dashboard</h2>
      <form onSubmit={handleMagicLinkLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', margin: '0.5rem 0' }}
        />
        <button type="submit">Send Magic Link</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
}
