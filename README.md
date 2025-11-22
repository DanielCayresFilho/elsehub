# ElseHub Frontend

Plataforma completa de atendimento via WhatsApp com gestão de campanhas e administração.

## 🚀 Tecnologias

- **Vue 3** - Framework progressivo
- **TypeScript** - Type safety
- **Vite** - Build tool rápido
- **Vue Router** - Roteamento
- **Pinia** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **Socket.IO** - WebSocket para chat em tempo real
- **Sass** - Pré-processador CSS

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Configurar variáveis de ambiente
# Edite .env e configure:
# VITE_API_BASE_URL=https://api.elsehub.covenos.com.br/api
# VITE_WS_URL=wss://api.elsehub.covenos.com.br
```

## 🏃 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Type check
npm run type-check
```

## 🐳 Docker

```bash
# Build da imagem
docker build -t elsehub-frontend .

# Executar com docker-compose
docker-compose up -d

# Parar containers
docker-compose down
```

## 📦 Deploy no Coolify

1. Configure as variáveis de ambiente no Coolify:
   - `VITE_API_BASE_URL`
   - `VITE_WS_URL`

2. Configure o build command:
   ```
   npm install && npm run build
   ```

3. Configure o start command:
   ```
   npx serve -s dist -l 5173
   ```

4. Porta: `5173`

## 🎨 Estrutura do Projeto

```
src/
├── assets/         # Assets estáticos
├── components/     # Componentes Vue
│   └── layout/    # Componentes de layout
├── layouts/       # Layouts de página
├── router/        # Configuração de rotas
├── services/      # Serviços de API
├── stores/        # Stores Pinia
├── styles/        # Estilos globais Sass
├── types/         # Tipos TypeScript
├── views/         # Páginas/Views
└── main.ts        # Entry point
```

## 🔐 Autenticação

O sistema utiliza JWT para autenticação:
- Access Token (curta duração)
- Refresh Token (longa duração)
- Refresh automático de tokens

## 🎯 Funcionalidades

- ✅ Autenticação e autorização (roles)
- ✅ Dashboard com estatísticas em tempo real
- ✅ Chat em tempo real via WebSocket
- ✅ Gestão de contatos (CRUD + Import CSV)
- ✅ Campanhas de disparo em massa
- ✅ Relatórios e analytics
- ✅ Gerenciamento de usuários
- ✅ Configuração de instâncias WhatsApp
- ✅ Templates de mensagens
- ✅ Tabulações personalizadas
- ✅ Tema claro/escuro
- ✅ Totalmente responsivo

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona perfeitamente em:
- Desktop (1024px+)
- Tablets (768px - 1023px)
- Mobile (< 768px)

## 🎨 Design

O design foi inspirado em:
- Discord - Interface de chat moderna
- Apple - Estética clean e minimalista

## 📄 Licença

© 2025 ElseHub - Todos os direitos reservados
