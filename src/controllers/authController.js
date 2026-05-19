const { AuthService } = require('../services/authService');
const service = new AuthService();

async function register(req, res, next) {
  try {
    const user = await service.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    res.json(await service.login(req.body));
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
