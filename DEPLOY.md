# 🚀 Guia de Deploy - Sistema de Agenda de Clientes

## 🌐 URLs do Projeto

- **Sistema Online:** https://tsp-agendamento.onrender.com
- **Repositório GitHub:** https://github.com/JefersonGama/TSP-AGENDAMENTO
- **Render Dashboard:** https://dashboard.render.com/

---

## Opções de Hospedagem Gratuita

### ✅ Recomendado: Render.com (Mais fácil)

**Por que Render?**
- 750 horas gratuitas por mês
- SSL/HTTPS automático
- Fácil integração com GitHub
- Suporte a Node.js nativo

**Passos para Deploy:**

1. **Criar conta no Render.com**
   - Acesse: https://render.com
   - Crie uma conta gratuita

2. **Enviar código para GitHub**
   ```bash
   git init
   git add .
   git commit -m "Sistema de agenda completo"
   git branch -M main
   git remote add origin https://github.com/JefersonGama/TSP-AGENDAMENTO.git
   git push -u origin main
   ```

   **Repositório:** https://github.com/JefersonGama/TSP-AGENDAMENTO

3. **Criar Web Service no Render**
   - No dashboard do Render, clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name**: sistema-agenda-clientes
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Configurar Variáveis de Ambiente**
   - No painel do Render, vá em "Environment"
   - Adicione:
     - `NODE_ENV` = `production`
     - `SESSION_SECRET` = `gere-uma-chave-secreta-aleatoria`

5. **Deploy Automático**
   - O Render fará o deploy automaticamente
   - Aguarde alguns minutos
   - Sua aplicação estará online!

6. **Importante: Credenciais do Google Sheets**
   - Você precisará adicionar o arquivo `credentials.json` manualmente
   - Opção 1: Usar variável de ambiente
   - Opção 2: Upload via dashboard do Render

---

### Alternativa: Railway.app

**Passos para Deploy:**

1. **Criar conta no Railway.app**
   - Acesse: https://railway.app
   - Login com GitHub

2. **Novo Projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório

3. **Configuração Automática**
   - Railway detecta Node.js automaticamente
   - Configure variáveis de ambiente (se necessário)

4. **Deploy**
   - Deploy é automático após push no GitHub

---

### Alternativa: Fly.io

**Passos para Deploy:**

1. **Instalar Fly CLI**
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login e Deploy**
   ```bash
   fly auth login
   fly launch
   fly deploy
   ```

---

## 🔐 Acesso ao Sistema

**URL de Produção:** https://tsp-agendamento.onrender.com

Após o deploy, acesse o sistema com:
- **E-mail e senha** cadastrados na aba "DADOS DE ACESSO" da planilha Google Sheets
- Login via Google Sheets em tempo real

---

## 📊 Google Sheets

Após o deploy, não esqueça de:
1. Compartilhar a planilha com: `botsigla@botsigla.iam.gserviceaccount.com`
2. Dar permissão de **Visualizador**

---

## 🛠️ Comandos Úteis

### Desenvolvimento Local
```bash
npm install
npm start
```

### Ver Logs (Render)
- Acesse o dashboard do Render
- Vá em "Logs" para ver erros

### Atualizar Deploy
```bash
git add .
git commit -m "Atualização"
git push
```
Deploy será automático!

---

## 💡 Dicas

1. **Banco de Dados**: SQLite funciona bem para até ~1000 usuários
2. **Backup**: Faça backup regular do arquivo `database.db`
3. **SSL**: Render fornece HTTPS automático
4. **Custom Domain**: Render permite domínio personalizado (grátis)

---

## 🆘 Problemas Comuns

### Erro de Sessão
- Configure `SESSION_SECRET` nas variáveis de ambiente

### Erro do Google Sheets
- Verifique se compartilhou a planilha
- Confirme o `credentials.json` está no servidor

### Aplicação não inicia
- Verifique logs no dashboard
- Confirme `PORT` está configurado corretamente
