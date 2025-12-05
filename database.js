const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas
db.serialize(() => {
  // Tabela de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      data_agendamento TEXT NOT NULL,
      horario TEXT,
      tipo_servico TEXT,
      status TEXT DEFAULT 'Pendente',
      observacoes TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nome_completo TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'operador',
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Criar usuário admin padrão (senha: admin123)
  const bcrypt = require('bcrypt');
  const senhaHash = bcrypt.hashSync('admin123', 10);
  
  db.run(`
    INSERT OR IGNORE INTO usuarios (username, password, nome_completo, role)
    VALUES ('admin', ?, 'Administrador', 'admin')
  `, [senhaHash]);
});

module.exports = db;
