const { google } = require('googleapis');
const path = require('path');

// ID da planilha do Google Sheets
const SPREADSHEET_ID = '1j2eko9UmxAHGvtVkslvkz0B5rzODwba21YpFKnULYVE';
const RANGE = 'Banco!A:I'; // SA, Nome, Telefone, Endereço, Tipo serviço, MICRO TERR., Plano, VERIFICADOR, CIDADE
const RANGE_USUARIOS = 'DADOS DE ACESSO!A:C'; // Aba de usuários

async function importarDadosDaPlanilha() {
  try {
    // Configurar autenticação com Service Account
    // Suporta variável de ambiente, secret file do Render, ou arquivo local
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    };

    if (process.env.GOOGLE_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
      // Secret file do Render ou arquivo local
      const possiblePaths = [
        '/etc/secrets/service-account.json', // Render Secret Files
        path.join(__dirname, 'credentials.json'), // Local
      ];
      
      for (const keyPath of possiblePaths) {
        if (require('fs').existsSync(keyPath)) {
          authConfig.keyFile = keyPath;
          break;
        }
      }
    }

    const auth = new google.auth.GoogleAuth(authConfig);

    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return { sucesso: false, mensagem: 'Nenhum dado encontrado na planilha' };
    }

    // Remover apenas a primeira linha (cabeçalho) - dados começam na linha 2
    const dados = rows.slice(1);

    // Mapear dados da planilha para o formato do banco
    const clientes = dados.map(row => ({
      sa: row[0] || '',
      nome: row[1] || '',
      telefone: row[2] || '',
      endereco: row[3] || '',
      tipo_servico: row[4] || '',
      micro_terr: row[5] || '',
      plano: row[6] || '',
      verificador: row[7] || '',
      cidade: row[8] || '',
    })).filter(cliente => cliente.nome);

    return { sucesso: true, dados: clientes };
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

// Função alternativa usando fetch direto (sem autenticação)
async function importarDadosPlanilhaPublica() {
  try {
    // URL para obter CSV da planilha pública
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Banco`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const csvText = await response.text();

    // Parse CSV
    const linhas = csvText.split('\n').map(linha => 
      linha.split(',').map(campo => campo.replace(/^"|"$/g, '').trim())
    );

    // Remover apenas a primeira linha (cabeçalho) - dados começam na linha 2
    const dados = linhas.slice(1);

    const clientes = dados.map(row => ({
      sa: row[0] || '',
      nome: row[1] || '',
      telefone: row[2] || '',
      endereco: row[3] || '',
      tipo_servico: row[4] || '',
      micro_terr: row[5] || '',
      plano: row[6] || '',
      verificador: row[7] || '',
      cidade: row[8] || '',
    })).filter(cliente => cliente.nome);

    return { sucesso: true, dados: clientes };
  } catch (error) {
    console.error('Erro ao importar dados da planilha pública:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

// Formatar data do formato brasileiro para YYYY-MM-DD
function formatarDataParaBanco(data) {
  if (!data) return '';
  
  // Tentar formato DD/MM/YYYY
  if (data.includes('/')) {
    const partes = data.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }
  
  // Tentar formato YYYY-MM-DD (já está correto)
  if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return data;
  }
  
  // Tentar formato de data do Google Sheets (MM/DD/YYYY ou DD/MM/YYYY)
  const dataObj = new Date(data);
  if (!isNaN(dataObj.getTime())) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  return '';
}

// Buscar usuários da planilha
async function buscarUsuariosDaPlanilha() {
  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    };

    if (process.env.GOOGLE_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
      const possiblePaths = [
        '/etc/secrets/service-account.json',
        path.join(__dirname, 'credentials.json'),
      ];
      
      for (const keyPath of possiblePaths) {
        if (require('fs').existsSync(keyPath)) {
          authConfig.keyFile = keyPath;
          break;
        }
      }
    }

    const auth = new google.auth.GoogleAuth(authConfig);

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE_USUARIOS,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return { sucesso: false, mensagem: 'Nenhum usuário encontrado na planilha' };
    }

    // Remover cabeçalho (primeira linha)
    const dados = rows.slice(1);

    // Mapear dados da planilha
    const usuarios = dados.map(row => ({
      nome: row[0] || '',
      email: row[1] || '',
      senha: row[2] || '',
    })).filter(usuario => usuario.nome && usuario.email && usuario.senha);

    return { sucesso: true, dados: usuarios };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

// Buscar usuário específico por email
async function buscarUsuarioPorEmail(email) {
  try {
    const resultado = await buscarUsuariosDaPlanilha();
    
    if (!resultado.sucesso) {
      return null;
    }

    const usuario = resultado.dados.find(u => 
      u.email.toLowerCase() === email.toLowerCase()
    );

    return usuario || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    return null;
  }
}

module.exports = {
  importarDadosDaPlanilha,
  importarDadosPlanilhaPublica,
  buscarUsuariosDaPlanilha,
  buscarUsuarioPorEmail,
};
