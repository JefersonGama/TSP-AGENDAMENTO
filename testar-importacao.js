const { importarDadosDaPlanilha } = require('./googleSheets');

async function testarImportacao() {
  console.log('🔍 Testando importação da planilha...\n');
  
  try {
    const resultado = await importarDadosDaPlanilha();
    
    if (!resultado.sucesso) {
      console.log('❌ ERRO na importação:', resultado.mensagem);
      return;
    }
    
    console.log('✅ Importação bem-sucedida!\n');
    console.log(`📊 Total de registros: ${resultado.dados.length}\n`);
    
    if (resultado.dados.length > 0) {
      console.log('👤 Primeiro registro:');
      console.log('─'.repeat(80));
      const primeiro = resultado.dados[0];
      console.log('SA:', primeiro.sa);
      console.log('Nome:', primeiro.nome);
      console.log('Telefone:', primeiro.telefone);
      console.log('Endereço:', primeiro.endereco);
      console.log('Tipo Serviço:', primeiro.tipo_servico);
      console.log('MICRO TERR:', primeiro.micro_terr);
      console.log('Plano:', primeiro.plano);
      console.log('Verificador:', primeiro.verificador);
      console.log('Cidade:', primeiro.cidade);
      console.log('─'.repeat(80));
      
      if (resultado.dados.length > 1) {
        console.log(`\n... e mais ${resultado.dados.length - 1} registros\n`);
      }
    } else {
      console.log('⚠️ Nenhum registro encontrado na planilha');
      console.log('\n📋 Verifique:');
      console.log('1. Aba "banco" existe na planilha?');
      console.log('2. Tem dados nas linhas (além do cabeçalho)?');
      console.log('3. A coluna "Nome" (B) está preenchida?');
    }
    
  } catch (error) {
    console.log('❌ ERRO ao testar importação:', error.message);
    console.log('\n🔍 Detalhes do erro:', error);
  }
}

testarImportacao();
