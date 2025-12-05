const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database');
const { importarDadosDaPlanilha, buscarUsuarioPorEmail } = require('./googleSheets');
const { verificarAutenticacao, verificarAdmin, hashPassword, verificarPassword } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Confiar no proxy do Render
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-segredo-super-secreto-mude-isso',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
app.use(express.static('public'));

// ============ ROTAS DE AUTENTICAÇÃO ============

// Login (usando Google Sheets)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    // Buscar usuário na planilha do Google Sheets
    const usuario = await buscarUsuarioPorEmail(username);

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // Verificar senha (aceita texto puro OU hash bcrypt)
    let senhaValida = false;
    
    // Se a senha na planilha começa com $2a$ ou $2b$, é hash bcrypt
    if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
      senhaValida = await verificarPassword(password, usuario.senha);
    } else {
      // Senha em texto puro - comparação direta
      senhaValida = password === usuario.senha;
    }
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    // Criar sessão
    req.session.userId = usuario.email;
    req.session.username = usuario.email;
    req.session.nome = usuario.nome;
    req.session.role = 'operador';

    res.json({
      success: true,
      user: {
        id: usuario.email,
        username: usuario.email,
        nome: usuario.nome,
        role: 'operador'
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  });
});

// Verificar sessão
app.get('/api/verificar-sessao', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      autenticado: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        nome: req.session.nome,
        role: req.session.role
      }
    });
  } else {
    res.json({ autenticado: false });
  }
});

// Registrar novo usuário (apenas admin)
app.post('/api/usuarios', verificarAutenticacao, verificarAdmin, async (req, res) => {
  const { username, password, nome_completo, email, role } = req.body;

  if (!username || !password || !nome_completo) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const senhaHash = await hashPassword(password);
    
    db.run(
      'INSERT INTO usuarios (username, password, nome_completo, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, senhaHash, nome_completo, email, role || 'operador'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Usuário já existe' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: 'Usuário criado com sucesso' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Listar usuários (apenas admin)
app.get('/api/usuarios', verificarAutenticacao, verificarAdmin, (req, res) => {
  db.all('SELECT id, username, nome_completo, email, role, ativo, criado_em FROM usuarios', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Listar usuários da planilha
app.get('/api/usuarios-planilha', verificarAutenticacao, async (req, res) => {
  try {
    const { buscarUsuariosDaPlanilha } = require('./googleSheets');
    const resultado = await buscarUsuariosDaPlanilha();

    if (!resultado.sucesso) {
      return res.status(500).json({ error: resultado.mensagem });
    }

    // Retornar usuários sem as senhas
    const usuarios = resultado.dados.map(u => ({
      nome: u.nome,
      email: u.email
    }));

    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários da planilha:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// ============ ROTAS DA API (PROTEGIDAS) ============

// Listar todos os clientes
app.get('/api/clientes', verificarAutenticacao, (req, res) => {
  const { busca, status, data_inicio, data_fim } = req.query;
  
  let query = 'SELECT * FROM clientes WHERE 1=1';
  let params = [];

  if (busca) {
    query += ' AND (nome LIKE ? OR telefone LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (data_inicio) {
    query += ' AND data_agendamento >= ?';
    params.push(data_inicio);
  }

  if (data_fim) {
    query += ' AND data_agendamento <= ?';
    params.push(data_fim);
  }

  query += ' ORDER BY criado_em DESC LIMIT 1000';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('[API] Erro ao buscar clientes:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('[API] Clientes encontrados:', rows.length);
    res.json(rows);
  });
});

// Buscar cliente por ID
app.get('/api/clientes/:id', verificarAutenticacao, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    res.json(row);
  });
});

// Criar novo cliente
app.post('/api/clientes', verificarAutenticacao, (req, res) => {
  const { sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade } = req.body;

  if (!nome) {
    res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    return;
  }

  const query = `
    INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Cliente criado com sucesso'
      });
    }
  );
});

// Atualizar cliente
app.put('/api/clientes/:id', verificarAutenticacao, (req, res) => {
  const { id } = req.params;
  const { sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade } = req.body;

  const query = `
    UPDATE clientes 
    SET sa = ?, nome = ?, telefone = ?, endereco = ?, 
        tipo_servico = ?, micro_terr = ?, plano = ?, verificador = ?, cidade = ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    query,
    [sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }
      res.json({ message: 'Cliente atualizado com sucesso' });
    }
  );
});

// Deletar cliente
app.delete('/api/clientes/:id', verificarAutenticacao, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM clientes WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    res.json({ message: 'Cliente deletado com sucesso' });
  });
});

// Estatísticas
app.get('/api/estatisticas', verificarAutenticacao, (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM clientes',
    pendentes: 'SELECT COUNT(*) as count FROM clientes WHERE status = "Pendente"',
    confirmados: 'SELECT COUNT(*) as count FROM clientes WHERE status = "Confirmado"',
    concluidos: 'SELECT COUNT(*) as count FROM clientes WHERE status = "Concluído"'
  };

  const stats = {};
  let completed = 0;

  Object.keys(queries).forEach(key => {
    db.get(queries[key], (err, row) => {
      if (!err) {
        stats[key] = row.count;
      }
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(stats);
      }
    });
  });
});

// Importar dados do Google Sheets
app.post('/api/importar-planilha', verificarAutenticacao, async (req, res) => {
  try {
    console.log('[API] Iniciando importação da planilha...');
    const resultado = await importarDadosDaPlanilha();

    console.log('[API] Resultado da importação:', {
      sucesso: resultado.sucesso,
      totalRegistros: resultado.dados?.length || 0
    });

    if (!resultado.sucesso) {
      console.error('[API] Erro na importação:', resultado.mensagem);
      res.status(500).json({ error: resultado.mensagem });
      return;
    }

    const clientes = resultado.dados;
    let importados = 0;
    let erros = 0;

    // Inserir cada cliente no banco
    for (const cliente of clientes) {
      try {
        await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(
            query,
            [cliente.sa, cliente.nome, cliente.telefone, cliente.endereco, 
             cliente.tipo_servico, cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        importados++;
      } catch (err) {
        console.error('Erro ao inserir cliente:', err);
        erros++;
      }
    }

    res.json({
      mensagem: 'Importação concluída',
      importados,
      erros,
      total: clientes.length
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    res.status(500).json({ error: 'Erro ao importar dados da planilha' });
  }
});

// Sincronizar (limpar e reimportar)
app.post('/api/sincronizar-planilha', verificarAutenticacao, async (req, res) => {
  try {
    console.log('[API] Iniciando sincronização...');
    // Limpar tabela
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM clientes', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('[API] Tabela limpa com sucesso');

    const resultado = await importarDadosDaPlanilha();

    console.log('[API] Resultado da importação:', {
      sucesso: resultado.sucesso,
      totalRegistros: resultado.dados?.length || 0
    });

    if (!resultado.sucesso) {
      console.error('[API] Erro na sincronização:', resultado.mensagem);
      res.status(500).json({ error: resultado.mensagem });
      return;
    }

    const clientes = resultado.dados;
    let importados = 0;

    for (const cliente of clientes) {
      try {
        await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(
            query,
            [cliente.sa, cliente.nome, cliente.telefone, cliente.endereco, 
             cliente.tipo_servico, cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        importados++;
      } catch (err) {
        console.error('Erro ao inserir cliente:', err);
      }
    }

    res.json({
      mensagem: 'Sincronização concluída',
      importados,
      total: clientes.length
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro ao sincronizar dados da planilha' });
  }
});

// Rota principal - redirecionar para login se não autenticado
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
