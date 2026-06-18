const jwt = require('jsonwebtoken');

/*
  AUTH MIDDLEWARE
  ───────────────
  Verifies the JWT from the Authorization header.
  On success: appends req.cafe (id, email, slug) so every downstream
  controller can safely scope its queries to req.cafe.id without
  re-fetching or trusting user-supplied body params.

  On failure: returns a clear 401 — never calls next().

  Usage in routes:
    router.get('/items', authenticate, itemController.list);

  The cafe_id in req.cafe.id is the ONLY source of truth for
  data isolation. Controllers must NEVER use req.body.cafe_id
  or req.params.cafe_id for scoping — only req.cafe.id.
*/

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Header must be: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or malformed Authorization header. Expected: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded cafe payload to req
    // Shape: { id, email, slug }
    req.cafe = {
      id:    decoded.cafeId,
      email: decoded.email,
      slug:  decoded.slug
    };

    next();
  } catch (err) {
    // Distinguish expired tokens from outright invalid ones
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { authenticate };
