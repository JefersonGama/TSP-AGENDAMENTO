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
      sa TEXT,
      nome TEXT NOT NULL,
      telefone TEXT,
      endereco TEXT,
      tipo_servico TEXT,
      micro_terr TEXT,
      plano TEXT,
      verificador TEXT,
      cidade TEXT,
      status TEXT DEFAULT 'COP',
      observacao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar colunas que podem não existir em bancos antigos
  const colunasAdicionais = [
    { nome: 'sa', tipo: 'TEXT' },
    { nome: 'endereco', tipo: 'TEXT' },
    { nome: 'micro_terr', tipo: 'TEXT' },
    { nome: 'plano', tipo: 'TEXT' },
    { nome: 'verificador', tipo: 'TEXT' },
    { nome: 'cidade', tipo: 'TEXT' },
    { nome: 'status', tipo: 'TEXT DEFAULT "COP"' },
    { nome: 'observacao', tipo: 'TEXT' }
  ];

  colunasAdicionais.forEach(coluna => {
    db.run(`ALTER TABLE clientes ADD COLUMN ${coluna.nome} ${coluna.tipo}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Erro ao adicionar coluna ${coluna.nome}:`, err);
      }
    });
  });

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
