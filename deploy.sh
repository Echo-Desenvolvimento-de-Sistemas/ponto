#!/bin/bash

# Script de Deploy - Ponto
# Este script automatiza o build e deploy da stack no Docker Swarm

echo "🚀 Iniciando processo de deploy..."

# 1. Carregar variáveis (opcional se já existirem no ambiente)
# source .env

# 2. Gerar Tag única por datetime (evita cache do Swarm)
export IMAGE_TAG=$(date +%Y%m%d%H%M%S)
echo "🏷️ Tag da imagem: $IMAGE_TAG"

# 3. Build das imagens locais
echo "📦 Construindo imagens Docker (sem cache para garantir atualização)..."
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Deploy da Stack no Swarm
echo "🚢 Fazendo deploy da stack 'ponto'..."
docker stack deploy -c docker-compose.prod.yml ponto

echo "🔄 Forçando atualização dos serviços para limpar cache de imagem..."
docker service update --force ponto_ponto-app
docker service update --force ponto_ponto-api
docker service update --force ponto_ponto-nginx

echo "✅ Deploy concluído! Verifique o status com: docker stack ps ponto"
echo "🌐 Acompanhe os logs com: docker service logs ponto_ponto-api -f"
