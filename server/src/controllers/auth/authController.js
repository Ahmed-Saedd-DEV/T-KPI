const authService = require("../../services/auth/authService");

async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.register({ email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login({ email, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await authService.getMe({
      authHeader: req.headers.authorization,
      currentUser: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
};
