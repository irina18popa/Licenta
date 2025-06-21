import crypto from 'crypto';

// Generate a secure random string for JWT secret
const secret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:', secret);