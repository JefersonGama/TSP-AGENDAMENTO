const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const db = new sqlite3.Database('./database.db');

function pergunta(questao) {
  return new Promise((resolve) => {
    rl.question(questao, resolve);
  });
}

async function criarUsuario() {
  console.log('\n=== Criar Novo Usuário ===\n');

  const username = await pergunta('Nome de usuário: ');
  const senha = await pergunta('Senha: ');
  const nomeCompleto = await pergunta('Nome completo: ');
  const email = await pergunta('Email (opcional): ');
  const role = await pergunta('Tipo (admin/operador) [operador]: ') || 'operador';

  const senhaHash = await bcrypt.hash(senha, 10);

  db.run(
    'INSERT INTO usuarios (username, password, nome_completo, email, role) VALUES (?, ?, ?, ?, ?)',
    [username, senhaHash, nomeCompleto, email || null, role],
    function(err) {
      if (err) {
        console.error('\n❌ Erro:', err.message);
      } else {
        console.log('\n✅ Usuário criado com sucesso!');
        console.log(`ID: ${this.lastID}`);
      }
      
      db.close();
      rl.close();
    }
  );
}

criarUsuario();
