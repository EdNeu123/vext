# 🚀 Guia de Deploy - Vext CRM

Este guia explica como fazer o deploy do Vext CRM com frontend no Firebase Hosting e backend no Vercel.

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Firebase](https://firebase.google.com/)
- Conta no [Vercel](https://vercel.com/)
- Banco de dados MySQL externo (Railway, PlanetScale, etc.)
- Chave API do [Google Gemini](https://makersuite.google.com/app/apikey)

---

## 🗄️ 1. Configurar Banco de Dados

### Opção A: Railway (Recomendado)

1. Acesse [railway.app](https://railway.app/)
2. Crie um novo projeto
3. Adicione um serviço MySQL
4. Copie a `DATABASE_URL` fornecida

### Opção B: PlanetScale

1. Acesse [planetscale.com](https://planetscale.com/)
2. Crie um novo database
3. Copie a connection string

### Opção C: Outro provedor

Qualquer provedor MySQL compatível funciona. Você precisará da connection string no formato:

```
mysql://user:password@host:port/database
```

---

## 🔧 2. Deploy do Backend (Vercel)

### 2.1. Preparar o projeto

```bash
cd backend
npm install
```

### 2.2. Configurar variáveis de ambiente

No dashboard do Vercel, adicione as seguintes variáveis:

```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://seu-app.web.app
CORS_ORIGIN=https://seu-app.web.app
GEMINI_API_KEY=sua-chave-gemini-aqui
```

### 2.3. Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 2.4. Deploy via GitHub

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push

### 2.5. Executar migrações

Após o primeiro deploy, execute as migrações:

```bash
# Localmente, apontando para o banco de produção
DATABASE_URL="sua-connection-string" npm run db:push

# Executar seeds (opcional)
DATABASE_URL="sua-connection-string" npm run db:seed
```

---

## 🌐 3. Deploy do Frontend (Firebase)

### 3.1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 3.2. Login no Firebase

```bash
firebase login
```

### 3.3. Criar projeto no Firebase Console

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o Firebase Hosting

### 3.4. Inicializar Firebase no projeto

```bash
cd frontend
firebase init hosting
```

Selecione:
- Use an existing project → Seu projeto
- Public directory → `dist`
- Configure as SPA → Yes
- Set up automatic builds → No

### 3.5. Configurar variáveis de ambiente

Crie um arquivo `.env.production` no diretório `frontend/`:

```env
VITE_API_URL=https://seu-backend.vercel.app/api
VITE_APP_TITLE=Vext CRM
VITE_APP_LOGO=/logo.svg
```

### 3.6. Build e Deploy

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

---

## 🔐 4. Configurar Gemini AI

### 4.1. Obter chave API

1. Acesse [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Copie a chave

### 4.2. Adicionar no Vercel

No dashboard do Vercel, adicione a variável:

```env
GEMINI_API_KEY=sua-chave-aqui
```

---

## ✅ 5. Verificar Deploy

### Backend

Teste os endpoints:

```bash
curl https://seu-backend.vercel.app/api/health
```

### Frontend

Acesse:

```
https://seu-app.web.app
```

---

## 🔄 6. CI/CD Automático

### GitHub Actions para Frontend

Crie `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### Vercel (Automático)

O Vercel já faz deploy automático quando você conecta o repositório.

---

## 🐛 7. Troubleshooting

### Erro de CORS

Certifique-se de que `FRONTEND_URL` e `CORS_ORIGIN` estão configurados corretamente no backend.

### Erro de conexão com banco

Verifique se:
- A `DATABASE_URL` está correta
- O banco permite conexões externas
- As migrações foram executadas

### Erro do Gemini

Verifique se:
- A `GEMINI_API_KEY` está configurada
- A chave é válida
- Você tem créditos disponíveis

---

## 📊 8. Monitoramento

### Vercel

- Acesse o dashboard do Vercel
- Veja logs em tempo real
- Configure alertas

### Firebase

- Acesse o Firebase Console
- Veja analytics de hosting
- Configure performance monitoring

---

## 🔒 9. Segurança

### Checklist de Segurança

- [ ] `JWT_SECRET` forte e único
- [ ] Variáveis de ambiente não commitadas
- [ ] CORS configurado corretamente
- [ ] HTTPS habilitado (automático no Vercel e Firebase)
- [ ] Banco de dados com SSL
- [ ] Rate limiting configurado
- [ ] Logs de auditoria ativos

---

## 📝 10. Manutenção

### Atualizar dependências

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Backup do banco

Configure backups automáticos no seu provedor de banco de dados.

### Monitorar custos

- Vercel: Monitore uso de serverless functions
- Firebase: Monitore bandwidth e storage
- Gemini: Monitore uso de tokens
- Banco: Monitore storage e conexões

---

## 🆘 Suporte

Para problemas ou dúvidas:

- Email: contato@vext.com.br
- GitHub Issues: [seu-repositorio/issues](https://github.com/seu-usuario/vext-crm/issues)

---

**Vext CRM** - Deploy feito com sucesso! 🎉
