async function testarPlanilhaPublica() {
  console.log('🔍 Testando leitura direta da planilha (CSV)...\n');
  
  const SPREADSHEET_ID = '1j2eko9UmxAHGvtVkslvkz0B5rzODwba21YpFKnULYVE';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=banco`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const csvText = await response.text();
    
    console.log('✅ Planilha acessada!\n');
    console.log('📄 Primeiras 20 linhas do CSV:\n');
    console.log('═'.repeat(100));
    
    const linhas = csvText.split('\n');
    linhas.slice(0, 20).forEach((linha, index) => {
      console.log(`Linha ${index}: ${linha}`);
    });
    
    console.log('═'.repeat(100));
    console.log(`\n📊 Total de linhas: ${linhas.length}`);
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

testarPlanilhaPublica();
