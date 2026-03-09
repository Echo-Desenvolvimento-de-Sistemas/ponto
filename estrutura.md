# Estrutura Técnica do Projeto - PontoNow

Este documento descreve a arquitetura, tecnologias e organização do sistema PontoNow, um SaaS de gestão de ponto eletrônico.

---

## 1. Stack Tecnológica

### Backend (Pasta `/backend`)
*   **Framework:** Laravel 12 (PHP 8.2+)
*   **Autenticação:** Laravel Sanctum (Autenticação via API baseada em tokens).
*   **Banco de Dados:** MySQL / MariaDB.
*   **Notificações:** Web Push Notifications (VAPID).
*   **Relatórios:** Geração de AFD (Portaria 671) e Espelho de Ponto.

### Frontend (Pasta `/frontend`)
*   **Framework:** React 19 + Vite 7.
*   **Estilização:** Vanilla CSS com variáveis modernas e design premium (Outfit & Inter fonts).
*   **Gerenciamento de Estado:** React Hooks e Dexie.js (IndexedDB) para persistência offline.
*   **Mapas:** Leaflet + React Leaflet para Geofencing.
*   **IA/Biometria:** Face-api.js para reconhecimento facial.
*   **Distribuição:** PWA (Progressive Web App) com suporte Offline-first.

---

## 2. Arquitetura do Sistema

### Multi-tenancy
O sistema utiliza uma estratégia de multi-tenancy baseada em colunas (`empresa_id`). 
*   Todas as entidades principais (Usuários, Registros de Ponto, Configurações) estão vinculadas a uma `empresa_id`.
*   O isolamento de dados é garantido através de Scopes no Eloquent (Laravel) ou filtros obrigatórios nas queries por empresa.

### Segurança e Compliance (Portaria 671)
*   **Assinatura Digital:** Cada registro de ponto gera um hash de segurança único.
*   **Imutabilidade:** Registros originais não podem ser alterados; correções são feitas via eventos de ocorrência/ajuste.
*   **Geofencing:** Validação de coordenadas GPS em tempo real contra áreas permitidas cadastradas pela empresa.

### Offline-First
O frontend utiliza **Dexie.js** para armazenar batidas de ponto localmente quando não há conexão. Assim que a internet é restabelecida, o Service Worker sincroniza os dados pendentes com a API Laravel.

---

## 3. Modelo de Dados Principal

*   **`empresas`**: Dados cadastrais da empresa cliente, plano e configurações White Label.
*   **`users`**: Entidade central de autenticação (SuperAdmin, Admin RH, Colaborador).
*   **`funcionario_detalhes`**: Informações específicas do funcionário (PIS, CPF, Jornada de Trabalho, Face Descriptor).
*   **`registro_pontos`**: Logs de batidas (entrada, almoço, volta, saída) com geolocalização e hash.
*   **`jornada_trabalhos`**: Definição de turnos, escalas (12x36), tolerâncias e adicional noturno.
*   **`ocorrencias`**: Justificativas, atestados e ajustes manuais aprovados pelo RH.

---

## 4. Organização do Repositório (Monorepo)

```text
/
├── backend/            # API Laravel 12
│   ├── app/Models/     # Modelos de dados e relacionamentos
│   ├── app/Http/       # Controllers e Middlewares da API
│   ├── database/       # Migrations e Seeders
│   └── routes/api.php  # Endpoints da aplicação
│
├── frontend/           # App React + Vite
│   ├── src/components/ # Componentes reutilizáveis
│   ├── src/pages/      # Telas (Admin, RH, Colaborador)
│   ├── src/services/   # Integração com API (Axios)
│   └── public/         # Assets e manifestos PWA
│
└── DOCUMENTACAO.md     # Visão funcional do negócio
└── estrutura.md       # Este documento (Arquitetura Técnica)
```

---

## 5. Fluxo de Registro de Ponto

1.  **Captura**: O app captura Geolocation (GPS) e Imagem de Rosto (opcional).
2.  **Validação Local**: Verifica Cercas Virtuais e realiza reconhecimento facial via `face-api.js`.
3.  **Registro**: 
    - Se Online: Envio imediato para `/api/ponto`.
    - Se Offline: Salva no IndexedDB e agenda sincronização.
4.  **Backend**: Valida token Sanctum, persiste no DB, gera Hash de segurança e retorna comprovante digital.
