// Checks the JWT token sent by the frontend and the user's role.
const jwt = require('jsonwebtoken');

// 1. Is the user logged in?
function verifyToken(req, res, next) {
  const header = req.headers.authorization; // "Bearer <token>"

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  const token = header.split(' ')[1];

  try {
    // If the token is valid, save the user info (id, role, name) on req
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// 2. Does the user have the right role? ('coordinator' or 'faculty')
function allowRole(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'You are not allowed to do this' });
    }
    next();
  };
}

module.exports = { verifyToken, allowRole };