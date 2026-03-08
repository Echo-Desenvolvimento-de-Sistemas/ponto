
# VPS CONFIGURATION REPORT - echo.dev.br
## Gerado em: 12/02/2026 | Portainer: portainer.echo.dev.br

---

## 1. BANCO DE DADOS PRINCIPAL (Database Stack)

### Container MySQL/MariaDB
- **Nome do Container**: database_mariadb.1.cu380teyzcz28lqh0dl3eaacw
- **Imagem**: mariadb:10.6.24
- **Versão**: 1:10.6.24+maria~ubu2204
- **Senha Root**: Akio2604*
- **Status**: Running (desde 2026-01-14 01:09:22)
- **Container ID**: 54f5f630e91dd4313a8d8775c4f79724ebd4da2c8b357e1660306a46bc2f1a89

### Acesso ao PhpMyAdmin
- **URL**: https://db.echo.dev.br
- **Porta**: 80 (HTTPS habilitado via Traefik)
- **Container**: database_phpmyadmin
- **Imagem**: phpmyadmin/phpmyadmin:latest
- **Limite Upload**: 64M

---

## 2. REDE PRINCIPAL (Infrastructure Network)

### Rede Overlay - ECHONET
- **Nome**: echonet
- **ID**: 8rohf7a9thqipvvpn3nmyq2ri
- **Driver**: overlay
- **Scope**: swarm
- **IPv4 Subnet**: 10.0.1.0/24
- **IPv4 Gateway**: 10.0.1.1
- **IP do MariaDB**: 10.0.1.146

---

## 3. STORAGE (Volumes)

### Volume Principal
- **Nome**: database_db_data
- **Caminho no Container**: /var/lib/mysql
- **Tipo**: Named Volume (persistente)

---

## 4. INFORMAÇÕES DE CONEXÃO PARA DEPLOY

Host (interno/Docker): mariadb
Host (IP direto): 10.0.1.146
Porta: 3306
Usuário: root
Senha: Akio2604*
Rede: echonet (subnet: 10.0.1.0/24)

text

---

## 5. DOCKER-COMPOSE (Stack: database)

```yaml
version: '3.8'

services:
  mariadb:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: "Akio2604*"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - echonet
    deploy:
      mode: replicated
      replicas: 1

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    environment:
      PMA_HOST: mariadb
      UPLOAD_LIMIT: 64M
    networks:
      - echonet
    deploy:
      mode: replicated
      replicas: 1
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.pma.loadbalancer.server.port=80"
      - "traefik.http.routers.pma.rule=Host(`db.echo.dev.br`)"
      - "traefik.http.routers.pma.entrypoints=websecure"
      - "traefik.http.routers.pma.tls.certresolver=myresolver"

volumes:
  db_data:

networks:
  echonet:
    external: true
6. STACKS DISPONÍVEIS NA VPS
Stack	Status
database	Total (Principal) ✅
evolution	Total
postgres	Total
rosa-educx	Total
rosa-sistema	Total
game-comercial	Limited (Demo)
portainer	Limited
shopservice	Limited
traefik	Limited
7. RESUMO PARA DEPLOY
Item	Valor
Rede Principal	echonet (10.0.1.0/24)
Hostname BD	mariadb
IP BD	10.0.1.146
Porta BD	3306
Usuário	root
Senha	Akio2604*
Volume	database_db_data
PhpMyAdmin	https://db.echo.dev.br
Stack	database
Driver	overlay (Docker Swarm)
