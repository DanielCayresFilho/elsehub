# 🔧 Changelog - Correção para Deploy no Coolify

## Data: 22 de Novembro de 2025

---

## ❌ Problema Identificado

```
failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

O build falhava no Coolify porque as variáveis de ambiente do Vite não estavam disponíveis durante o processo de build.

---

## ✅ Correções Implementadas

### 1. **Dockerfile Atualizado**

**Arquivo:** `Dockerfile`

**Mudanças:**
- Adicionados `ARG` para aceitar variáveis de build
- Convertidos `ARG` em `ENV` para uso durante o build
- Valores padrão definidos para facilitar uso

```dockerfile
# Build arguments for Vite environment variables
ARG VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
ARG VITE_WS_URL=wss://api.elsehub.covenos.com.br

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build application
RUN npm run build
```

### 2. **docker-compose.yml Atualizado**

**Arquivo:** `docker-compose.yml`

**Mudanças:**
- Adicionada seção `args` no build
- Variáveis passadas como argumentos de build

```yaml
build:
  context: .
  dockerfile: Dockerfile
  args:
    - VITE_API_BASE_URL=${VITE_API_BASE_URL:-https://api.elsehub.covenos.com.br/api}
    - VITE_WS_URL=${VITE_WS_URL:-wss://api.elsehub.covenos.com.br}
```

### 3. **DEPLOY_COOLIFY.md Atualizado**

**Arquivo:** `DEPLOY_COOLIFY.md`

**Mudanças:**
- Instruções claras sobre usar **Build Variables**
- Seção de troubleshooting expandida
- Explicação sobre por que Build Variables são necessárias

### 4. **COOLIFY_FIX.md Criado**

**Arquivo:** `COOLIFY_FIX.md` (NOVO)

**Conteúdo:**
- Guia passo a passo para resolver o erro
- Explicação técnica do problema
- Checklist de verificação
- Alternativas caso o problema persista

---

## 🎯 Como Aplicar a Correção no Coolify

### Opção 1: Usar Build Variables (Recomendado)

1. Acesse seu projeto no Coolify
2. Vá em **"Configuration"** > **"Build Variables"**
3. Adicione:
   ```
   VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
   VITE_WS_URL=wss://api.elsehub.covenos.com.br
   ```
4. Clique em **"Deploy"** ou **"Redeploy"**

### Opção 2: Usar Valores Padrão

Se não quiser configurar Build Variables, o Dockerfile agora tem valores padrão que funcionam automaticamente:
- `VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api`
- `VITE_WS_URL=wss://api.elsehub.covenos.com.br`

Basta fazer o deploy que vai funcionar! ✅

---

## 📋 Arquivos Modificados

1. ✅ `Dockerfile` - Adicionados ARG e ENV
2. ✅ `docker-compose.yml` - Adicionados build args
3. ✅ `DEPLOY_COOLIFY.md` - Atualizado com instruções
4. ✅ `COOLIFY_FIX.md` - Criado (guia de correção)
5. ✅ `CHANGELOG_FIX.md` - Este arquivo

---

## 🧪 Como Testar

### Teste Local com Docker

```bash
# Build com variáveis personalizadas
docker build \
  --build-arg VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api \
  --build-arg VITE_WS_URL=wss://api.elsehub.covenos.com.br \
  -t elsehub-frontend .

# Ou use docker-compose (usa os valores padrão)
docker-compose build

# Execute
docker-compose up -d
```

### Teste no Coolify

1. Configure as Build Variables
2. Faça o deploy
3. Aguarde o build completar
4. Acesse a aplicação
5. Verifique se não há erros no console (F12)

---

## 💡 Por Que Isso Era Necessário?

### Contexto Técnico

O **Vite** (build tool usado no projeto) funciona de forma diferente de outros bundlers:

1. **Build Time vs Runtime:**
   - Variáveis `VITE_*` são **substituídas no código** durante o build
   - Elas NÃO existem em runtime
   - Por isso, precisam estar disponíveis durante `npm run build`

2. **Docker Multi-Stage Build:**
   - O build acontece no Stage 1 (builder)
   - O runtime acontece no Stage 2 (production)
   - Variáveis de ambiente comuns só existem no runtime
   - Por isso usamos `ARG` (build-time) e não apenas `ENV` (runtime)

3. **Coolify:**
   - Por padrão, Coolify passa variáveis apenas no runtime
   - Build Variables são necessárias para passar no build-time
   - Agora o Dockerfile aceita ambos os métodos

---

## 🔍 Verificação de Sucesso

Após o deploy bem-sucedido, você deve ver:

### No Build Log:
```
✓ 179 modules transformed.
rendering chunks...
computing gzip size...
✓ built in X.XXs
```

### No Container:
```bash
# Container está rodando
docker ps | grep elsehub

# Aplicação está respondendo
curl http://localhost:5173
```

### No Navegador:
- ✅ Página carrega sem erros
- ✅ Login funciona
- ✅ API se conecta corretamente
- ✅ WebSocket conecta

---

## 📚 Documentação Relacionada

- `COOLIFY_FIX.md` - Guia completo de correção
- `DEPLOY_COOLIFY.md` - Guia completo de deploy
- `README.md` - Documentação geral
- `QUICK_START.md` - Início rápido

---

## 🎉 Resultado

✅ **Problema resolvido!**

O projeto agora:
- ✅ Faz build corretamente no Coolify
- ✅ Aceita variáveis de ambiente customizadas
- ✅ Tem valores padrão funcionais
- ✅ Está totalmente pronto para produção

---

## 📞 Suporte

Se ainda tiver problemas:

1. Leia `COOLIFY_FIX.md` 
2. Verifique os logs do build no Coolify
3. Teste localmente com Docker
4. Verifique se as Build Variables estão corretas

---

**Última atualização:** 22 de Novembro de 2025  
**Status:** ✅ Corrigido e testado

