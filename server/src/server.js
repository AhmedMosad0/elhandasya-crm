import 'dotenv/config';
import app from './app.js';

// Refuse to start in production with a weak or default JWT secret.
const _secret = process.env.JWT_SECRET || '';
if (!_secret || _secret.length < 32 || _secret === 'elhandasya-dev-secret-change-in-prod') {
  const msg = 'FATAL: JWT_SECRET must be ≥32 characters and must not be the default dev value.';
  if (process.env.NODE_ENV === 'production') throw new Error(msg);
  console.warn('[SECURITY]', msg);
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
