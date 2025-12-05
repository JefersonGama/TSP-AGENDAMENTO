# 🚀 Deploy no Render - Passo a Passo

## Status Atual
- ✅ Código local funcionando
- ⏳ Deploy no Render pendente

## Passos para Deploy

### 1️⃣ Preparar o Repositório GitHub

```bash
cd "c:\Users\Microsoft\Desktop\Projetos\TSP BANCO DE ENCAIXE"
git init
git add .
git commit -m "Sistema de agendamento TSP - versão inicial"
git branch -M main
git remote add origin https://github.com/JefersonGama/TSP-AGENDAMENTO.git
git push -u origin main
```

### 2️⃣ Configurar no Render.com

1. **Acesse:** https://dashboard.render.com/
2. **Clique em:** "New +" → "Web Service"
3. **Conecte o GitHub:** Autorize o Render a acessar seu repositório
4. **Selecione:** JefersonGama/TSP-AGENDAMENTO

### 3️⃣ Configurações do Serviço

**Configuração Básica:**
- **Name:** `tsp-agendamento`
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** (deixe em branco)
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free`

### 4️⃣ Variáveis de Ambiente

Clique em "Advanced" e adicione:

```
NODE_ENV=production
SESSION_SECRET=TSP_SECRET_KEY_2025_MUDAR_ISSO
PORT=3000
```

### 5️⃣ Adicionar credentials.json

**Opção 1: Via Variável de Ambiente (Recomendado)**

1. No Render, vá em "Environment"
2. Adicione uma nova variável:
   - **Key:** `GOOGLE_CREDENTIALS`
   - **Value:** Cole o conteúdo completo do `credentials.json`

3. Atualize o código `googleSheets.js` para usar a variável:

```javascript
const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_CREDENTIALS 
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : require(path.join(__dirname, 'credentials.json')),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
```

**Opção 2: Via Secret File**

1. No Render, vá em "Secret Files"
2. Clique em "Add Secret File"
3. **Filename:** `credentials.json`
4. **Contents:** Cole o conteúdo do arquivo credentials.json
5. Salve

### 6️⃣ Deploy

1. Clique em "Create Web Service"
2. Aguarde o deploy (3-5 minutos)
3. Quando aparecer "Live", clique na URL

### 7️⃣ Verificar

Acesse: https://tsp-agendamento.onrender.com

Se aparecer a tela de login, está funcionando! ✅

---

## ⚠️ Problemas Comuns

### "Application failed to respond"
- Verifique se `PORT` está configurado corretamente
- Veja os logs: Dashboard → Logs

### "Credential error"
- Confirme que adicionou o `credentials.json`
- Verifique se compartilhou a planilha com o email da service account

### "Build failed"
- Verifique o `package.json`
- Veja os logs de build no Render

---

## 📝 Checklist Pré-Deploy

- [ ] Código commitado no GitHub
- [ ] Repositório público ou Render autorizado
- [ ] Variáveis de ambiente configuradas
- [ ] credentials.json adicionado
- [ ] Planilha compartilhada com `botsigla@botsigla.iam.gserviceaccount.com`
- [ ] Aba "banco" e "DADOS DE ACESSO" criadas na planilha
- [ ] Pelo menos 1 usuário cadastrado em "DADOS DE ACESSO"

---

## 🔄 Atualizar Deploy

Após fazer mudanças locais:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Render fará deploy automático em ~2 minutos.

---

## 📊 Monitoramento

- **Logs em tempo real:** Dashboard → Logs
- **Métricas:** Dashboard → Metrics
- **Status:** Dashboard → Events

---

## 🆘 Suporte

Se o deploy falhar:
1. Veja os logs completos no Render
2. Verifique se todas as dependências estão no package.json
3. Confirme que o servidor está usando `process.env.PORT`
