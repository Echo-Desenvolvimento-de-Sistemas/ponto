# Guia de Deploy - Sistema de Ponto 🚀

Este guia detalha como realizar o build e o deploy da aplicação na sua VPS utilizando Docker Swarm e integrando-se à rede `echonet`.

## 1. Pré-requisitos na VPS

- Docker instalado e modo **Swarm** ativado (`docker swarm init`).
- Acesso à rede externa `echonet` (já existente na sua VPS).
- Git instalado para clonar/puxar o repositório.

## 2. Configuração de Variáveis de Ambiente

Antes de rodar o deploy, você deve configurar os arquivos `.env` de produção baseando-se nos templates criados:

### Backend (Laravel)
Navegue até `backend/` e crie o arquivo `.env`:
```bash
cp .env.production .env
```
> [!IMPORTANT]
> Verifique se o `DB_PASSWORD` no `.env` está correto de acordo com o seu MariaDB (`Akio2604*`).

### Frontend (React)
Navegue até `frontend/` e crie o arquivo `.env`:
```bash
cp .env.production .env
```

## 3. Realizando o Deploy

Na raiz do projeto, você encontrará o script `deploy.sh`. Ele automatiza o build das imagens e o comando de stack do Swarm.

```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar o deploy
./deploy.sh
```

O comando interno que o script executa para subir a stack é:
```bash
docker stack deploy -c docker-compose.prod.yml ponto
```

## 4. Comandos Úteis de Verificação

### Verificar se os serviços estão rodando:
```bash
docker stack ps ponto
```

### Ver logs do Backend (API):
```bash
docker service logs ponto_ponto-api -f
```

### Resolver problemas de permissão no Laravel:
Se o site der erro 500 ou problemas de escrita em logs/storage:
```bash
docker exec $(docker ps -q -f name=ponto_ponto-api) chown -R www-data:www-data storage bootstrap/cache
```

## 5. Acesso

- **Frontend**: `https://ponto.echo.dev.br`
- **Backend/API**: `https://ponto.echo.dev.br/api`

---
*Gerado em: 08/03/2026*
