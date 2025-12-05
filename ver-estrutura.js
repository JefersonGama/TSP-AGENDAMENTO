const { google } = require('googleapis');
const path = require('path');

async function verEstruturaPlanilha() {
  console.log('🔍 Verificando estrutura da planilha...\n');
  
  const SPREADSHEET_ID = '1j2eko9UmxAHGvtVkslvkz0B5rzODwba21YpFKnULYVE';
  const RANGE = 'banco!A:I';
  
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
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('❌ Nenhum dado encontrado');
      return;
    }

    console.log(`✅ Total de linhas: ${rows.length}\n`);
    console.log('📋 PRIMEIRAS 10 LINHAS DA PLANILHA:\n');
    console.log('═'.repeat(120));
    
    rows.slice(0, 10).forEach((row, index) => {
      console.log(`\nLinha ${index}:`);
      console.log(`  [A] SA: "${row[0] || ''}"`);
      console.log(`  [B] Nome: "${row[1] || ''}"`);
      console.log(`  [C] Telefone: "${row[2] || ''}"`);
      console.log(`  [D] Endereço: "${row[3] || ''}"`);
      console.log(`  [E] Tipo Serviço: "${row[4] || ''}"`);
      console.log(`  [F] MICRO TERR: "${row[5] || ''}"`);
      console.log(`  [G] Plano: "${row[6] || ''}"`);
      console.log(`  [H] VERIFICADOR: "${row[7] || ''}"`);
      console.log(`  [I] CIDADE: "${row[8] || ''}"`);
    });
    
    console.log('\n═'.repeat(120));
    
    // Contar quantas linhas têm nome preenchido
    let comNome = 0;
    let semNome = 0;
    
    rows.slice(1).forEach(row => {
      if (row[1] && row[1].trim() !== '' && !row[1].includes('#REF!')) {
        comNome++;
      } else {
        semNome++;
      }
    });
    
    console.log(`\n📊 Estatísticas (excluindo cabeçalho):`);
    console.log(`   Linhas COM nome válido: ${comNome}`);
    console.log(`   Linhas SEM nome válido: ${semNome}`);
    console.log(`   Total: ${comNome + semNome}`);
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

verEstruturaPlanilha();
