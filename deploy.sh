#!/bin/bash

# Script de Deploy - Ponto
# Este script automatiza o build e deploy da stack no Docker Swarm

echo "🚀 Iniciando processo de deploy..."

# 1. Carregar variáveis (opcional se já existirem no ambiente)
# source .env

# 2. Build das imagens locais
echo "📦 Construindo imagens Docker..."
docker compose -f docker-compose.prod.yml build

# 3. Deploy da Stack no Swarm
echo "🚢 Fazendo deploy da stack 'ponto'..."
docker stack deploy -c docker-compose.prod.yml ponto

echo "✅ Deploy concluído! Verifique o status com: docker stack ps ponto"
echo "🌐 Acompanhe os logs com: docker service logs ponto_ponto-api -f"
