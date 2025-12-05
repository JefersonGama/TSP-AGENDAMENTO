# Sistema de Agenda de Clientes

Sistema web para gerenciamento de agenda futura de clientes com autenticação e sincronização com Google Sheets.

## ✨ Funcionalidades

- 🔐 **Autenticação de Usuários** (login seguro)
- 👥 **Cadastro de clientes** com informações completas
- 📅 **Agendamento** com data e horário
- 📊 **Controle de status** (Pendente, Confirmado, Concluído, Cancelado)
- 🔍 **Busca e filtros** avançados
- 📥 **Importação do Google Sheets** (sincronização automática)
- 🎨 **Interface intuitiva e responsiva**
- 👨‍💼 **Gestão de usuários** (admin)

## 🚀 Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as credenciais do Google Sheets:**
   - Coloque o arquivo `credentials.json` na raiz do projeto
   - Compartilhe sua planilha com o email da service account

3. **Inicie o servidor:**
```bash
npm start
```

4. **Acesse no navegador:**
```
http://localhost:3000
```

## 🔑 Sistema de Acesso

**Autenticação via Google Sheets:**

Os usuários são gerenciados na aba **"DADOS DE ACESSO"** da planilha:

| Nome | E-mail | Senha |
|------|--------|-------|
| João Silva | joao@empresa.com | senha123 |

- Login com **e-mail e senha** cadastrados na planilha
- Adicione novos usuários direto na planilha
- Acesso imediato sem necessidade de reiniciar o sistema

## 👤 Gerenciar Usuários

**Adicione usuários direto na planilha Google Sheets:**

1. Abra a planilha no Google Sheets
2. Vá para a aba **"DADOS DE ACESSO"**
3. Adicione uma nova linha com:
   - **Coluna A (Nome)**: Nome completo do usuário
   - **Coluna B (E-mail)**: E-mail de acesso
   - **Coluna C (Senha)**: Senha de acesso
4. Salve e pronto! O usuário pode fazer login imediatamente

⚠️ **Segurança**: Certifique-se de que apenas pessoas autorizadas têm acesso de edição à planilha!

## 📦 Deploy Online (Gratuito)

### 🌐 Sistema em Produção
- **URL:** https://tsp-agendamento.onrender.com
- **GitHub:** https://github.com/JefersonGama/TSP-AGENDAMENTO
- **Hospedagem:** Render.com (gratuito)

Veja o guia completo em [DEPLOY.md](DEPLOY.md)

### Opções Recomendadas:
1. **Render.com** - Mais fácil (recomendado) ✅ Em uso
2. **Railway.app** - Deploy rápido
3. **Fly.io** - Alta performance

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite
- **Autenticação**: bcrypt + express-session
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Integração**: Google Sheets API

## 📁 Estrutura do Projeto

```
sistema-agenda-clientes/
├── server.js              # Servidor Express
├── database.js            # Configuração do banco
├── auth.js                # Sistema de autenticação
├── googleSheets.js        # Integração Google Sheets
├── credentials.json       # Credenciais Google (não commitar!)
├── public/
│   ├── index.html        # Interface principal
│   ├── login.html        # Página de login
│   ├── styles.css        # Estilos
│   └── script.js         # Lógica frontend
├── package.json
├── README.md
└── DEPLOY.md             # Guia de deploy

```

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Sessões seguras com express-session
- Proteção de rotas com middleware
- credentials.json em .gitignore

## 📝 Desenvolvimento

Para modo de desenvolvimento com auto-reload:
```bash
npm run dev
```

## 🆘 Suporte

Para problemas ou dúvidas, verifique:
1. Logs do servidor
2. Console do navegador
3. Arquivo DEPLOY.md para deploy online
