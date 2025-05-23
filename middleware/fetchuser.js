// middleware/fetchuser.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'anasisagood$boy'; //for debugging

console.log('fetchuser.js: Starting, JWT_SECRET:', JWT_SECRET);

const fetchuser = (req, res, next) => {
  console.log('fetchuser: Processing request:', req.method, req.url);
  console.log('fetchuser: Headers:', JSON.stringify(req.headers, null, 2));

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    console.log('fetchuser: Raw Authorization header:', authHeader || 'none');

    if (!authHeader) {
      console.error('fetchuser: No Authorization header');
      return res.status(401).json({ success: false, msg: 'No token provided' });
    }


    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      console.error('fetchuser: Invalid token format, got:', authHeader);
      return res.status(400).json({ success: false, msg: 'Invalid token format' });
    }
    console.log('fetchuser: Extracted token:', token.substring(0, 10) + '...');

    // Verify token
    console.log('fetchuser: Verifying token with JWT_SECRET:', JWT_SECRET);
    const data = jwt.verify(token, JWT_SECRET);
    console.log('fetchuser: Token payload:', JSON.stringify(data, null, 2));

    if (!data.user || !data.user.id) {
      console.error('fetchuser: Invalid payload:', data);
      return res.status(400).json({ success: false, msg: 'Invalid token payload' });
    }

    req.user = data.user;
    console.log('fetchuser: Set req.user:', req.user);
    next();
  } catch (error) {
    console.error('fetchuser: Error:', error.message, error.stack);
    return res.status(401).json({ success: false, msg: 'Invalid or expired token', error: error.message });
  }
};

module.exports = fetchuser;