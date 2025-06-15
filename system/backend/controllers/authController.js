
const jwt = require('jsonwebtoken');

exports.generateTokenAndRedirect = (req, res) => {
  const user = req.user;
  const token = jwt.sign({
    id: user._id,
    role: user.role
  }, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
};
