const { hashPassword } = require('./auth');

async function gerarHashSenha() {
  console.log('🔐 Gerador de Hash para Senhas\n');
  
  const senha = '1234'; // ⚠️ MUDE ESTA SENHA AQUI
  
  console.log(`📝 Senha escolhida: ${senha}`);
  console.log('⏳ Gerando hash...\n');
  
  const senhaHash = await hashPassword(senha);
  
  console.log('✅ Hash gerado com sucesso!\n');
  console.log('═'.repeat(80));
  console.log('COPIE ESTE HASH E COLE NA COLUNA "Senha" DA PLANILHA:');
  console.log('═'.repeat(80));
  console.log(senhaHash);
  console.log('═'.repeat(80));
  console.log('\n📋 Instruções:');
  console.log('1. Copie o hash acima (toda a linha começando com $2b$)');
  console.log('2. Abra a planilha Google Sheets');
  console.log('3. Vá na aba "DADOS DE ACESSO"');
  console.log('4. Cole o hash na coluna "Senha" do usuário: Jeferson Gama');
  console.log('5. Salve a planilha');
  console.log('6. Aguarde ~30 segundos');
  console.log('7. Teste o login novamente com:');
  console.log(`   Email: jeferson.martinelli@tspgroup.com.br`);
  console.log(`   Senha: ${senha}`);
  console.log('\n');
}

gerarHashSenha();
