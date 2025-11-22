# 🔧 Fix: Erro de Build no Coolify

## ❌ Problema

```
failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

## ✅ Solução

O problema ocorre porque as variáveis de ambiente do Vite não estão disponíveis durante o build.

### Passo a Passo no Coolify:

#### 1. Acesse seu Projeto no Coolify

#### 2. Configure as Build Variables

**IMPORTANTE:** Configure como **Build Variables**, NÃO como Environment Variables!

1. Clique em **"Configuration"** ou **"Settings"**
2. Procure por **"Build Variables"** ou **"Build Arguments"**
3. Adicione as seguintes variáveis:

```
VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
VITE_WS_URL=wss://api.elsehub.covenos.com.br
```

#### 3. Faça um Novo Deploy

1. Clique em **"Deploy"** ou **"Redeploy"**
2. Aguarde o build completar
3. O build agora deve funcionar! ✅

---

## 📝 Explicação Técnica

### Por que isso acontece?

No **Vite**, as variáveis de ambiente `VITE_*` são incorporadas no código JavaScript durante o **build time** (tempo de compilação), não no runtime.

Por isso, elas precisam estar disponíveis como **argumentos de build** no Docker.

### O que foi corrigido?

O `Dockerfile` foi atualizado para aceitar essas variáveis:

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

---

## 🎯 Checklist

Antes de fazer deploy, certifique-se que:

- [ ] As Build Variables estão configuradas no Coolify
- [ ] Os valores das URLs estão corretos
- [ ] Você está usando Build Variables (não Environment Variables)
- [ ] Fez um novo deploy após configurar

---

## 🔍 Como Verificar se Funcionou

Após o deploy bem-sucedido:

1. **Acesse a aplicação**
2. **Abra o Console do navegador** (F12)
3. **Verifique se não há erros** de conexão com a API
4. **Teste o login**

Se tudo estiver funcionando, as variáveis foram configuradas corretamente! 🎉

---

## 🆘 Ainda com Problemas?

### Verifique os Logs

No Coolify:
1. Vá em "Logs" ou "Build Logs"
2. Procure por erros específicos
3. Verifique se as variáveis aparecem no log de build

### Teste Localmente

```bash
# No seu terminal local
export VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
export VITE_WS_URL=wss://api.elsehub.covenos.com.br

# Teste o build
npm run build

# Se funcionar localmente, o problema é na configuração do Coolify
```

### Alternativa: Build Manual

Se o Coolify continuar com problemas, você pode fazer o build localmente e enviar apenas os arquivos estáticos:

```bash
# 1. Configure as variáveis localmente
export VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
export VITE_WS_URL=wss://api.elsehub.covenos.com.br

# 2. Faça o build
npm run build

# 3. Envie a pasta dist/ para o servidor
# (Use FTP, SCP, ou outro método)

# 4. Sirva com qualquer servidor web
npx serve -s dist -l 5173
```

---

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Build Args](https://docs.docker.com/engine/reference/builder/#arg)
- [Coolify Documentation](https://coolify.io/docs)

---

## ✅ Resumo

**O problema:** Variáveis de ambiente não disponíveis durante o build  
**A solução:** Configure como Build Variables no Coolify  
**O resultado:** Build funciona perfeitamente! 🚀

