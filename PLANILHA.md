# 📊 Configuração da Planilha Google Sheets

## Estrutura da Planilha

Sua planilha deve ter **2 abas** configuradas:

### 1️⃣ Aba "banco" - Dados de Clientes

Colunas na ordem:
- **A**: Nome do Cliente
- **B**: Telefone
- **C**: Data do Agendamento (formato: DD/MM/AAAA ou AAAA-MM-DD)
- **D**: Horário
- **E**: Tipo de Serviço
- **F**: Status (Pendente, Confirmado, Concluído, Cancelado)
- **G**: Observações

**Exemplo:**
```
Nome             | Telefone      | Data       | Horário | Tipo Serviço | Status     | Observações
João Silva       | 11999999999   | 10/12/2025 | 14:00   | Consulta     | Pendente   | Cliente novo
Maria Santos     | 11988888888   | 11/12/2025 | 10:30   | Reunião      | Confirmado | Trazer documentos
```

---

### 2️⃣ Aba "DADOS DE ACESSO" - Usuários do Sistema

Colunas na ordem:
- **A**: Nome (nome completo do usuário)
- **B**: E-mail (usado para login)
- **C**: Senha (senha de acesso)

**Exemplo:**
```
Nome              | E-mail                  | Senha
João Silva        | joao@tspgroup.com       | senhaSegura123
Maria Santos      | maria@tspgroup.com      | maria2025
Pedro Oliveira    | pedro@tspgroup.com      | pedro@TSP
```

---

## 🔐 Configuração de Segurança

### Permissões da Planilha

1. **Service Account (para o sistema):**
   - E-mail: `botsigla@botsigla.iam.gserviceaccount.com`
   - Permissão: **Visualizador**
   
2. **Administradores (humanos):**
   - Permissão: **Editor**
   - Podem adicionar/remover usuários
   - Podem gerenciar clientes

3. **Operadores (opcional):**
   - Permissão: **Apenas visualizador** (se quiser que usem só o sistema)

---

## ✅ Checklist de Configuração

- [ ] Aba "banco" criada com 7 colunas (A-G)
- [ ] Aba "DADOS DE ACESSO" criada com 3 colunas (A-C)
- [ ] Primeira linha de cada aba tem os cabeçalhos
- [ ] Planilha compartilhada com `botsigla@botsigla.iam.gserviceaccount.com`
- [ ] Pelo menos 1 usuário cadastrado na aba "DADOS DE ACESSO"

---

## 🚀 Como Testar

1. **Adicione um usuário de teste:**
   - Nome: Seu Nome
   - E-mail: seu@email.com
   - Senha: teste123

2. **Abra o sistema:**
   - http://localhost:3000 (local)
   - ou sua URL de deploy

3. **Faça login com o e-mail e senha cadastrados**

4. **Teste a importação:**
   - Clique em "📥 Importar Planilha"
   - Os dados da aba "banco" devem aparecer no sistema

---

## ⚠️ Problemas Comuns

### "Nenhum usuário encontrado"
- Verifique se a aba se chama exatamente **"DADOS DE ACESSO"**
- Confirme que há dados a partir da linha 2 (linha 1 é cabeçalho)
- Verifique se as 3 colunas têm dados

### "E-mail ou senha incorretos"
- Senhas são **case-sensitive** (maiúsculas/minúsculas importam)
- E-mail deve estar exatamente como na planilha
- Sem espaços extras antes ou depois

### "Erro ao buscar usuários"
- Confirme que compartilhou com `botsigla@botsigla.iam.gserviceaccount.com`
- Verifique o arquivo `credentials.json` no servidor
- Veja os logs do servidor para mais detalhes

---

## 💡 Dicas

1. **Senhas Seguras**: Use senhas fortes para proteger o acesso
2. **Backup**: Faça backup regular da planilha
3. **Organização**: Mantenha a planilha organizada e limpa
4. **Auditoria**: Revise periodicamente quem tem acesso

---

## 📝 Estrutura Completa da Planilha

```
Google Sheets: Sistema de Agenda TSP Group
│
├── Aba: banco (clientes)
│   ├── Coluna A: Nome
│   ├── Coluna B: Telefone
│   ├── Coluna C: Data Agendamento
│   ├── Coluna D: Horário
│   ├── Coluna E: Tipo Serviço
│   ├── Coluna F: Status
│   └── Coluna G: Observações
│
└── Aba: DADOS DE ACESSO (usuários)
    ├── Coluna A: Nome
    ├── Coluna B: E-mail
    └── Coluna C: Senha
```

---

## 🔄 Atualizações em Tempo Real

- **Novos usuários**: Adicione na planilha, login funciona imediatamente
- **Novos clientes**: Adicione na planilha, clique em "🔄 Sincronizar" no sistema
- **Alterações**: Refletidas na próxima sincronização/login
