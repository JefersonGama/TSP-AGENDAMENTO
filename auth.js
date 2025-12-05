const bcrypt = require('bcrypt');

// Middleware para verificar se o usuário está autenticado
function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Não autenticado. Faça login primeiro.' });
  }
}

// Middleware para verificar se é admin
function verificarAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
}

// Hash de senha
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verificar senha
async function verificarPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  verificarAutenticacao,
  verificarAdmin,
  hashPassword,
  verificarPassword
};
