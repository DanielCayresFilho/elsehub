# Guia de Deploy no Coolify - ElseHub Frontend

## 📋 Requisitos

- Coolify instalado e configurado
- Acesso ao repositório Git
- Domínio configurado (opcional)

## 🚀 Configuração no Coolify

### 1. Criar Novo Projeto

1. Acesse o Coolify
2. Clique em "New Resource" > "Application"
3. Selecione o tipo: **Docker Compose**

### 2. Configurar Repositório

- **Repository URL**: URL do seu repositório Git
- **Branch**: `main` ou branch desejada
- **Build Pack**: Docker Compose

### 3. Variáveis de Ambiente

⚠️ **IMPORTANTE**: No Coolify, configure estas variáveis como **Build Variables** (não Runtime Variables):

**Build Variables** (Clique em "Edit Build Variables"):
```env
VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
VITE_WS_URL=wss://api.elsehub.covenos.com.br
```

**Runtime Variables** (opcional):
```env
NODE_ENV=production
```

> **Por quê?** As variáveis `VITE_*` são incorporadas no código durante o build, então precisam estar disponíveis como Build Variables no Coolify.

### 4. Configuração de Rede

- **Port**: `5173`
- **Protocol**: HTTP
- **Public**: Sim (se desejar acesso público)

### 5. Domínio Personalizado (Opcional)

1. Vá em "Domains"
2. Adicione seu domínio: `elsehub.seudominio.com`
3. Configure SSL automático (Let's Encrypt)

## 🔧 Build e Deploy

### Opção 1: Docker Compose (Recomendado)

O Coolify irá automaticamente usar o `docker-compose.yml` presente no repositório.

**Arquivo já configurado**: `docker-compose.yml`

### Opção 2: Dockerfile Standalone

Se preferir usar apenas o Dockerfile:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l 5173
```

## 📝 Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] API backend funcionando e acessível
- [ ] WebSocket habilitado no backend
- [ ] Porta 5173 liberada no firewall
- [ ] SSL configurado (se usando HTTPS)
- [ ] CORS configurado no backend para o domínio do frontend

## 🔍 Verificação Pós-Deploy

Após o deploy, verifique:

1. **Frontend carrega**: Acesse a URL do aplicativo
2. **API conecta**: Abra o console do navegador e verifique se não há erros de conexão
3. **Login funciona**: Teste fazer login com credenciais válidas
4. **WebSocket conecta**: Verifique se o chat em tempo real funciona
5. **Rotas funcionam**: Navegue entre diferentes páginas

## 🐛 Troubleshooting

### Problema: Build falha com "exit code: 1" no npm run build

**Causa:** Variáveis de ambiente do Vite não configuradas corretamente.

**Solução:**
1. No Coolify, vá em **"Edit Build Variables"**
2. Adicione as variáveis:
   ```
   VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
   VITE_WS_URL=wss://api.elsehub.covenos.com.br
   ```
3. **Importante:** Use "Build Variables", NÃO "Environment Variables"
4. Faça um novo deploy

### Problema: Frontend não carrega

**Solução:**
- Verifique os logs do container: `docker logs <container_id>`
- Verifique se a porta 5173 está exposta corretamente

### Problema: Erro de CORS

**Solução:**
- Configure o backend para aceitar requisições do domínio do frontend
- Adicione o domínio no CORS do backend:
  ```typescript
  app.use(cors({
    origin: ['https://elsehub.seudominio.com'],
    credentials: true
  }))
  ```

### Problema: WebSocket não conecta

**Solução:**
- Verifique se `VITE_WS_URL` está correto
- Certifique-se de usar `wss://` para HTTPS ou `ws://` para HTTP
- Verifique se o backend está com WebSocket habilitado
- Verifique o proxy reverso (Nginx/Traefik) para websockets

### Problema: Variáveis de ambiente não funcionam

**Solução:**
- No Vite, variáveis de ambiente são definidas em **build time**
- Após alterar variáveis, faça um novo build:
  ```bash
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
  ```

## 🔄 Atualização da Aplicação

Para atualizar o frontend no Coolify:

1. Faça push das alterações para o repositório
2. No Coolify, clique em "Deploy" no projeto
3. Aguarde o rebuild e restart automático

Ou via CLI:

```bash
# No servidor com Coolify
cd /path/to/project
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoramento

No Coolify você pode:

- Ver logs em tempo real
- Monitorar uso de recursos (CPU/RAM)
- Configurar webhooks para notificações
- Ver histórico de deploys

## 🔒 Segurança

### Checklist de Segurança:

- [ ] SSL/TLS habilitado (HTTPS)
- [ ] Variáveis sensíveis não expostas no código
- [ ] CORS configurado corretamente
- [ ] Headers de segurança configurados
- [ ] Rate limiting no backend
- [ ] Tokens JWT com expiração adequada

### Headers de Segurança Recomendados (Backend):

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss://api.elsehub.covenos.com.br"]
    }
  }
}))
```

## 📈 Performance

### Otimizações já implementadas:

- ✅ Code splitting automático (Vite)
- ✅ Lazy loading de rotas
- ✅ Compressão gzip
- ✅ Assets otimizados
- ✅ CSS minimizado
- ✅ Tree shaking

### Recomendações adicionais:

1. **CDN**: Use Cloudflare ou similar para cache de assets
2. **Cache HTTP**: Configure headers de cache no servidor
3. **Compressão Brotli**: Melhor que gzip (se disponível)

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs do container
2. Teste localmente com Docker
3. Verifique a conectividade com a API
4. Revise as variáveis de ambiente

## 🎉 Conclusão

Após seguir este guia, sua aplicação ElseHub frontend estará rodando no Coolify, pronta para produção!

Para mais informações, consulte:
- [Documentação do Coolify](https://coolify.io/docs)
- [Documentação do Vite](https://vitejs.dev)
- [README.md](./README.md) do projeto

