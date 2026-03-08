# Guia de Deploy Passo a Passo - Ponto 🚀

Este guia explica como levar o código do seu computador para a sua VPS e colocar o sistema no ar.

## Passo 1: Preparar a Pasta na VPS

Acesse sua VPS via SSH e crie a pasta onde o projeto vai ficar:

```bash
mkdir -p /root/projetos/ponto
cd /root/projetos/ponto
```

## Passo 2: Clonar o Repositório

Agora, baixe o código do GitHub para dentro dessa pasta:

```bash
# Se for a primeira vez
git clone https://github.com/Echo-Desenvolvimento-de-Sistemas/ponto.git .

# Se você já clonou e só quer atualizar o código:
git pull origin main
```

## Passo 3: Configurar os Arquivos .env (Muito Importante!)

Os arquivos `.env` guardam as senhas e não vão para o GitHub por segurança (apenas os modelos `.env.production` que eu criei vão). Você precisa criá-los manualmente na VPS:

### 3.1. Backend
Entre na pasta do backend e crie o `.env`:
```bash
cd /root/projetos/ponto/backend
cp .env.production .env
```
> [!TIP]
> Use o comando `nano .env` para abrir o arquivo e conferir se a `DB_PASSWORD` é realmente `Akio2604*`. Se mudar algo, aperte `Ctrl+O` para salvar e `Ctrl+X` para sair.

### 3.2. Frontend
Entre na pasta do frontend e crie o `.env`:
```bash
cd /root/projetos/ponto/frontend
cp .env.production .env
```

## Passo 4: Dar Permissão ao Script de Deploy

Volte para a raiz do projeto e prepare o script que eu criei para você:

```bash
cd /root/projetos/ponto
chmod +x deploy.sh
```

## Passo 5: Executar o Deploy 🚀

Agora é só rodar o script. Ele vai construir as imagens (build) e subir os containers:

```bash
./deploy.sh
```

---

## O que fazer se der erro?

### 1. Erro de Permissão no Laravel (Site abre com erro 500)
Se o site carregar mas der erro ao tentar salvar algo ou registrar ponto, rode este comando:
```bash
docker exec $(docker ps -q -f name=ponto_ponto-api) chown -R www-data:www-data storage bootstrap/cache
```

### 2. Ver se os containers subiram mesmo
```bash
docker stack ps ponto
```

### 3. Ver os logs em tempo real (para debugar)
```bash
docker service logs ponto_ponto-api -f
```

## Acesso
- **Site**: [https://ponto.echo.dev.br](https://ponto.echo.dev.br)
- **API**: [https://ponto.echo.dev.br/api](https://ponto.echo.dev.br/api)

---
*Dica: Fique tranquilo, o `.env` que você criou manualmente na VPS NÃO será apagado quando você der `git pull` no futuro.*
