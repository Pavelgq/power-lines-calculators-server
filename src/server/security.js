const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["token"];
  console.log(authHeader);
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_ADMIN_SECRET, (err, user) => {
    if (err) {
      logger.error(err);
      return res.sendStatus(403);
    }
    console.log("check token:", user);
    req.user = user;
    next();
  });
}

function checkClientKey(req, res, next) {
  const clientTokenHeader = req.headers["acceptToken"];
  if (!clientTokenHeader) {
    return res.sendStatus(401);
  }

  jwt.verify(clientTokenHeader, process.env.JWT_CLIENT_SECRET, (err, user) => {
    if (err) {
      logger.error(err);
      return res.sendStatus(403);
    }
    console.log("check accept:", user);
    req.user = user;

    next();
  });
}

//TODO: Проверка после парсинга ключа на совпадение с ключами в базе

module.exports = {
  authenticateToken,
  checkClientKey,
};
