#!/bin/sh

# Otimizações do Laravel para Produção
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Rodar migrações
php artisan migrate --force

# Iniciar o PHP-FPM
php-fpm
