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
  const { sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, observacao } = req.body;

  console.log('[API] Criar cliente - observacao recebida:', observacao);

  if (!nome) {
    res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    return;
  }

  const query = `
    INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status, observacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, 'COP', observacao],
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
  const { sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status, observacao } = req.body;

  console.log('[API] Atualizar cliente', id, '- observacao recebida:', observacao);

  const query = `
    UPDATE clientes 
    SET sa = ?, nome = ?, telefone = ?, endereco = ?, 
        tipo_servico = ?, micro_terr = ?, plano = ?, verificador = ?, cidade = ?, status = ?, observacao = ?, atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    query,
    [sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status || 'COP', observacao, id],
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

// Atualizar status do cliente
app.put('/api/clientes/:id/status', verificarAutenticacao, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório' });
  }

  const query = 'UPDATE clientes SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?';

  db.run(query, [status, id], function(err) {
    if (err) {
      console.error('[API] Erro ao atualizar status:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }
    console.log(`[API] Status do cliente ${id} alterado para: ${status}`);
    res.json({ message: 'Status atualizado com sucesso' });
  });
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
            INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(
            query,
            [cliente.sa, cliente.nome, cliente.telefone, cliente.endereco, 
             cliente.tipo_servico, cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade, 'COP'],
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

// Sincronizar (atualizar sem perder dados manuais)
app.post('/api/sincronizar-planilha', verificarAutenticacao, async (req, res) => {
  try {
    console.log('[API] Iniciando sincronização inteligente...');

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
    let atualizados = 0;
    let novos = 0;

    // Criar Set com todos os SAs da planilha
    const sasNaPlanilha = new Set(clientes.map(c => c.sa).filter(sa => sa));
    let removidos = 0;

    for (const cliente of clientes) {
      try {
        // Verificar se cliente já existe pelo SA
        const existe = await new Promise((resolve, reject) => {
          db.get('SELECT id, status, observacao FROM clientes WHERE sa = ?', [cliente.sa], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existe) {
          // Atualizar dados da planilha, mas manter status e observacao do banco
          await new Promise((resolve, reject) => {
            const query = `
              UPDATE clientes 
              SET nome = ?, telefone = ?, endereco = ?, tipo_servico = ?, 
                  micro_terr = ?, plano = ?, verificador = ?, cidade = ?, atualizado_em = CURRENT_TIMESTAMP
              WHERE sa = ?
            `;
            db.run(
              query,
              [cliente.nome, cliente.telefone, cliente.endereco, cliente.tipo_servico,
               cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade, cliente.sa],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          atualizados++;
        } else {
          // Inserir novo cliente
          await new Promise((resolve, reject) => {
            const query = `
              INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(
              query,
              [cliente.sa, cliente.nome, cliente.telefone, cliente.endereco, 
               cliente.tipo_servico, cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade, 'COP'],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          novos++;
        }
      } catch (err) {
        console.error('Erro ao processar cliente:', err);
      }
    }

    // Remover registros que não existem mais na planilha
    try {
      const clientesNoBanco = await new Promise((resolve, reject) => {
        db.all('SELECT id, sa FROM clientes WHERE sa IS NOT NULL AND sa != ""', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      for (const clienteBanco of clientesNoBanco) {
        if (!sasNaPlanilha.has(clienteBanco.sa)) {
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM clientes WHERE id = ?', [clienteBanco.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          removidos++;
        }
      }
    } catch (err) {
      console.error('[API] Erro ao remover clientes obsoletos:', err);
    }

    console.log(`[API] Sincronização concluída: ${novos} novos, ${atualizados} atualizados, ${removidos} removidos`);

    res.json({
      mensagem: 'Sincronização concluída',
      novos,
      atualizados,
      removidos,
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

// Sincronização automática a cada 5 minutos
let intervalSincronizacao = null;
let intervalLimpezaDiaria = null;

function iniciarSincronizacaoAutomatica() {
  console.log('[SYNC] Iniciando sincronização automática a cada 5 minutos...');
  
  // Fazer primeira sincronização após 30 segundos do servidor iniciar
  setTimeout(() => {
    sincronizarAutomaticamente();
  }, 30000);

  // Depois a cada 5 minutos
  intervalSincronizacao = setInterval(() => {
    sincronizarAutomaticamente();
  }, 5 * 60 * 1000); // 5 minutos
}

function iniciarLimpezaDiaria() {
  console.log('[CLEANUP] Agendamento de limpeza diária configurado para 04:00');
  
  function agendarProximaLimpeza() {
    const agora = new Date();
    const proximaLimpeza = new Date();
    proximaLimpeza.setHours(4, 0, 0, 0); // 4h da manhã
    
    // Se já passou das 4h hoje, agendar para amanhã
    if (agora > proximaLimpeza) {
      proximaLimpeza.setDate(proximaLimpeza.getDate() + 1);
    }
    
    const tempoAteProximaLimpeza = proximaLimpeza.getTime() - agora.getTime();
    console.log(`[CLEANUP] Próxima limpeza em: ${new Date(proximaLimpeza).toLocaleString('pt-BR')}`);
    
    setTimeout(() => {
      limparBancoDiariamente();
      // Agendar próxima limpeza (24h depois)
      agendarProximaLimpeza();
    }, tempoAteProximaLimpeza);
  }
  
  agendarProximaLimpeza();
}

async function limparBancoDiariamente() {
  try {
    console.log('[CLEANUP] 🧹 Iniciando limpeza diária do banco...');
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM clientes', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('[CLEANUP] ✅ Banco limpo com sucesso!');
    
    // Fazer sincronização completa logo após limpar
    console.log('[CLEANUP] Iniciando sincronização completa...');
    await sincronizarAutomaticamente();
    
  } catch (error) {
    console.error('[CLEANUP] ❌ Erro na limpeza diária:', error);
  }
}

async function sincronizarAutomaticamente() {
  try {
    console.log('[SYNC] Executando sincronização automática...');
    
    const resultado = await importarDadosDaPlanilha();

    if (!resultado.sucesso) {
      console.error('[SYNC] Erro na sincronização automática:', resultado.mensagem);
      return;
    }

    const clientes = resultado.dados;
    let atualizados = 0;
    let novos = 0;
    let removidos = 0;

    // Criar Set com todos os SAs da planilha para comparação rápida
    const sasNaPlanilha = new Set(clientes.map(c => c.sa).filter(sa => sa));

    // Processar cada cliente da planilha
    for (const cliente of clientes) {
      try {
        const existe = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM clientes WHERE sa = ?', [cliente.sa], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existe) {
          await new Promise((resolve, reject) => {
            const query = `
              UPDATE clientes 
              SET nome = ?, telefone = ?, endereco = ?, tipo_servico = ?, 
                  micro_terr = ?, plano = ?, verificador = ?, cidade = ?, atualizado_em = CURRENT_TIMESTAMP
              WHERE sa = ?
            `;
            db.run(
              query,
              [cliente.nome, cliente.telefone, cliente.endereco, cliente.tipo_servico,
               cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade, cliente.sa],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          atualizados++;
        } else {
          await new Promise((resolve, reject) => {
            const query = `
              INSERT INTO clientes (sa, nome, telefone, endereco, tipo_servico, micro_terr, plano, verificador, cidade, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(
              query,
              [cliente.sa, cliente.nome, cliente.telefone, cliente.endereco, 
               cliente.tipo_servico, cliente.micro_terr, cliente.plano, cliente.verificador, cliente.cidade, 'COP'],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          novos++;
        }
      } catch (err) {
        console.error('[SYNC] Erro ao processar cliente:', err);
      }
    }

    // Remover registros que não existem mais na planilha
    try {
      const clientesNoBanco = await new Promise((resolve, reject) => {
        db.all('SELECT id, sa FROM clientes WHERE sa IS NOT NULL AND sa != ""', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      for (const clienteBanco of clientesNoBanco) {
        if (!sasNaPlanilha.has(clienteBanco.sa)) {
          // Cliente existe no banco mas não está mais na planilha - remover
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM clientes WHERE id = ?', [clienteBanco.id], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          removidos++;
          console.log(`[SYNC] 🗑️ Removido SA: ${clienteBanco.sa} (não está mais na planilha)`);
        }
      }
    } catch (err) {
      console.error('[SYNC] Erro ao remover clientes obsoletos:', err);
    }

    console.log(`[SYNC] ✅ Sincronização automática concluída: ${novos} novos, ${atualizados} atualizados, ${removidos} removidos de ${clientes.length} total`);
  } catch (error) {
    console.error('[SYNC] Erro na sincronização automática:', error);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  
  // Iniciar sincronização automática
  iniciarSincronizacaoAutomatica();
  
  // Iniciar limpeza diária às 4h
  iniciarLimpezaDiaria();
});

// Limpar intervalo ao encerrar
process.on('SIGTERM', () => {
  console.log('[SYNC] Parando sincronização automática...');
  if (intervalSincronizacao) clearInterval(intervalSincronizacao);
  if (intervalLimpezaDiaria) clearInterval(intervalLimpezaDiaria);
  process.exit(0);
});
