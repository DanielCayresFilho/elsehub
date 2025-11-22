# ⚡ Quick Start - ElseHub Frontend

Guia rápido para começar a usar o ElseHub Frontend em minutos.

---

## 🚀 Início Rápido (Desenvolvimento)

### 1. Clone e Configure

```bash
# Clone o repositório (se aplicável)
git clone <seu-repositorio>
cd elsehubV

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Já estão configuradas para a API oficial
```

### 2. Execute

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🔑 Credenciais de Teste

Para testar a aplicação, use as credenciais fornecidas pelo backend:

```
Email: admin@example.com
Senha: password123
```

**Ou crie um novo usuário através da API backend.**

---

## 📱 Testando as Funcionalidades

### 1. Login
- Acesse a página de login
- Entre com suas credenciais
- Você será redirecionado ao Dashboard

### 2. Dashboard
- Visualize estatísticas em tempo real
- Veja conversas recentes
- Acesse ações rápidas

### 3. Chat (Conversas)
- Vá para "Conversas" no menu lateral
- Selecione uma conversa
- Envie mensagens em tempo real
- Teste transferência e finalização

### 4. Contatos
- Vá para "Contatos"
- Adicione um novo contato
- Teste importação de CSV
- Edite e exclua contatos

### 5. Campanhas
- Vá para "Campanhas"
- Clique em "Nova Campanha"
- Configure e crie uma campanha
- Faça upload de contatos
- Inicie a campanha

### 6. Administração (Admin apenas)
- **Usuários**: Gerencie operadores e supervisores
- **Instâncias**: Configure conexões WhatsApp
- **Templates**: Crie mensagens prontas
- **Tabulações**: Defina motivos de fechamento

---

## 🎨 Testando o Tema

- Clique no ícone de sol/lua no canto superior direito
- O tema alternará entre claro e escuro
- A preferência é salva automaticamente

---

## 📋 Checklist de Teste

Use este checklist para testar todas as funcionalidades:

### Autenticação
- [ ] Login com credenciais válidas
- [ ] Logout
- [ ] Token refresh automático
- [ ] Redirecionamento ao acessar rota protegida sem login

### Dashboard
- [ ] Visualizar estatísticas
- [ ] Ver conversas recentes
- [ ] Clicar em ações rápidas

### Chat
- [ ] Listar conversas
- [ ] Selecionar conversa
- [ ] Enviar mensagem
- [ ] Receber mensagem (WebSocket)
- [ ] Transferir conversa
- [ ] Finalizar conversa

### Contatos
- [ ] Listar contatos
- [ ] Criar novo contato
- [ ] Editar contato
- [ ] Excluir contato
- [ ] Importar CSV
- [ ] Buscar contatos

### Campanhas
- [ ] Listar campanhas
- [ ] Criar nova campanha
- [ ] Upload de contatos
- [ ] Iniciar campanha
- [ ] Pausar/Retomar
- [ ] Ver detalhes e estatísticas

### Histórico
- [ ] Ver conversas finalizadas
- [ ] Filtrar por data
- [ ] Ver detalhes de cada conversa

### Relatórios (Admin/Supervisor)
- [ ] Ver estatísticas gerais
- [ ] Ver performance por operador
- [ ] Filtrar por período

### Administração (Admin)
- [ ] Criar usuário
- [ ] Ativar/Desativar usuário
- [ ] Criar instância WhatsApp
- [ ] Ver QR Code
- [ ] Criar template
- [ ] Criar tabulação

### Configurações
- [ ] Editar perfil
- [ ] Alterar senha
- [ ] Alternar tema

### Responsividade
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Sidebar responsiva
- [ ] Tabelas responsivas

---

## 🐳 Deploy Rápido (Docker)

```bash
# Build e execute
docker-compose up -d

# Veja os logs
docker-compose logs -f

# Pare os containers
docker-compose down
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev

# Build
npm run build           # Build de produção
npm run preview         # Preview do build

# Type Check
npm run type-check      # Verifica tipos TypeScript

# Docker
docker-compose up -d    # Inicia containers
docker-compose down     # Para containers
docker-compose logs -f  # Ver logs
```

---

## 🌐 URLs Importantes

- **Frontend Dev**: http://localhost:5173
- **API Backend**: https://api.elsehub.covenos.com.br/api
- **WebSocket**: wss://api.elsehub.covenos.com.br

---

## 📝 Exemplo de CSV para Importação

### Contatos
```csv
name,phone,cpf,additional1
João Silva,5511999999999,12345678900,Cliente Premium
Maria Santos,5511988888888,98765432100,Empresa XYZ
Pedro Costa,5511977777777,,Novo Lead
```

### Campanhas
```csv
name,phone
João Silva,5511999999999
Maria Santos,5511988888888
Pedro Costa,5511977777777
Ana Lima,5511966666666
```

---

## 🐛 Problemas Comuns

### Problema: "Failed to fetch"
**Solução**: Verifique se a API backend está rodando e acessível

### Problema: WebSocket não conecta
**Solução**: 
1. Verifique a URL do WebSocket (.env)
2. Certifique-se que o backend está com WS habilitado
3. Use `wss://` para HTTPS e `ws://` para HTTP

### Problema: Erro CORS
**Solução**: Configure o backend para aceitar o domínio do frontend

### Problema: Páginas em branco
**Solução**: 
1. Abra o console do navegador (F12)
2. Verifique erros no console
3. Verifique se as variáveis de ambiente estão corretas

---

## 📚 Próximos Passos

1. ✅ Explore todas as funcionalidades
2. ✅ Teste em diferentes dispositivos
3. ✅ Configure o backend
4. ✅ Faça o deploy no Coolify (veja DEPLOY_COOLIFY.md)

---

## 💡 Dicas

- Use o **modo escuro** para uma experiência mais confortável
- O **status online/offline** (operadores) é atualizado em tempo real
- As **notificações** de novas mensagens aparecem automaticamente
- Use **Ctrl/Cmd + Click** para abrir links em nova aba
- A aplicação funciona offline com Service Worker (se configurado)

---

## 🎓 Aprendendo Mais

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sass Documentation](https://sass-lang.com/documentation)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 🎉 Pronto!

Você está pronto para usar o ElseHub! 

Se tiver dúvidas, consulte:
- **README.md** - Documentação completa
- **PROJETO_COMPLETO.md** - Visão geral do projeto
- **DEPLOY_COOLIFY.md** - Guia de deploy

**Happy Coding! 🚀**

