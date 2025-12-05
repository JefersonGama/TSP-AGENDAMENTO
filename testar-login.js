const { buscarUsuariosDaPlanilha } = require('./googleSheets');
const { verificarPassword } = require('./auth');

async function testarLogin() {
  console.log('🔍 Testando conexão com Google Sheets...\n');
  
  // Teste 1: Verificar se consegue acessar a planilha
  try {
    const resultado = await buscarUsuariosDaPlanilha();
    
    if (!resultado.sucesso || !resultado.dados || resultado.dados.length === 0) {
      console.log('❌ ERRO: Nenhum usuário encontrado na planilha');
      console.log('\n📋 Checklist:');
      console.log('1. Planilha compartilhada com: botsigla@botsigla.iam.gserviceaccount.com?');
      console.log('2. Aba "DADOS DE ACESSO" existe?');
      console.log('3. Estrutura correta: Nome | E-mail | Senha');
      console.log('4. Tem pelo menos 1 usuário cadastrado?');
      console.log('\n🔍 Mensagem:', resultado.mensagem || 'Sem dados');
      return;
    }
    
    const usuarios = resultado.dados;
    console.log('✅ Planilha acessada com sucesso!');
    console.log(`\n📊 Total de usuários encontrados: ${usuarios.length}\n`);
    
    const usuario = usuarios[0];
    
    console.log('👤 Primeiro usuário encontrado:');
    console.log('Nome:', usuario.nome);
    console.log('Email:', usuario.email);
    console.log('Senha (hash):', usuario.senha);
    
    // Teste 2: Verificar se a senha está com hash
    if (!usuario.senha.startsWith('$2')) {
      console.log('\n❌ ERRO: A senha na planilha está em TEXTO PURO!');
      console.log('As senhas devem estar com hash bcrypt (começam com $2a$ ou $2b$)');
      console.log('\n💡 Solução: Use o script criar-usuario.js para gerar o hash:');
      console.log('node criar-usuario.js');
      return;
    }
    
    console.log('\n✅ Senha está com hash correto!');
    
    // Teste 3: Testar verificação de senha
    const senhaCorreta = await verificarPassword('senha123', usuario.senha); // Coloque a senha real
    console.log('\n🔐 Teste de senha:');
    console.log('Senha testada: senha123');
    console.log('Resultado:', senhaCorreta ? '✅ CORRETA' : '❌ INCORRETA');
    
    if (!senhaCorreta) {
      console.log('\n💡 A senha na planilha não corresponde. Você precisa:');
      console.log('1. Gerar o hash com: node criar-usuario.js');
      console.log('2. Copiar o hash gerado');
      console.log('3. Colar na coluna "Senha" da planilha DADOS DE ACESSO');
    }
    
  } catch (error) {
    console.log('❌ ERRO ao acessar planilha:', error.message);
    console.log('\n📋 Possíveis causas:');
    console.log('1. Planilha não compartilhada com o service account');
    console.log('2. Credenciais do Google incorretas');
    console.log('3. ID da planilha errado no código');
    console.log('\n🔍 Detalhes do erro:', error);
  }
}

testarLogin();
