# Documentação de Funcionalidades - PontoNow

O PontoNow é um sistema de gestão de ponto eletrônico focado em SaaS, com suporte a multi-tenancy, geolocalização e identificação visual customizada (White Label). Abaixo estão descritas as funcionalidades detalhadas divididas por perfis de acesso.

---

## 1. Perfil: Administrador Global (SaaS Admin)
O foco deste perfil é a gestão do ecossistema do sistema e dos clientes (empresas).

*   **Dashboard SaaS:** Visão geral da saúde do sistema, incluindo total de empresas cadastradas, total de usuários ativos, tickets de suporte pendentes e volume de registros de ponto no dia.
*   **Gestão de Empresas:** Cadastro, edição e exclusão de empresas clientes através do módulo "Gestão de Empresas".
*   **Convites de Onboarding:** Geração de links de convite exclusivos para que novas empresas realizem o autocadastro do seu administrador de RH.
*   **Gestão de Usuários Globais:** Controle de usuários com permissões administrativas em nível de sistema (Super Admins).
*   **Personalização SaaS (White Label):** Configuração global de identidade visual (logo, cores, nome do sistema) que será aplicada por padrão aos clientes.
*   **Auditoria do Sistema:** Visualização de logs de atividades críticas realizadas por qualquer usuário no sistema para fins de segurança e compliance.
*   **Suporte (Tickets):** Visualização e gestão de solicitações de suporte, como pedidos de reset de senha enviados por administradores de empresas.

---

## 2. Perfil: Gestor de RH (Administrador da Empresa)
O foco deste perfil é a gestão operacional da empresa e seus colaboradores.

*   **Dashboard Operacional:** Monitoramento em tempo real dos colaboradores presentes, faltas estimadas, alertas de atraso e violações de geolocalização (cerca virtual).
*   **Mapa ao Vivo:** Visualização em mapa dos locais onde os registros de ponto estão sendo realizados.
*   **Gestão de Colaboradores:** Cadastro e manutenção de dados dos funcionários. Possibilidade de forçar reset de senha para segurança.
*   **Configurações de Jornada:** Criação de turnos regulares, escalas **12x36** e suporte a **Jornadas Noturnas** com cálculo automático de Adicional Noturno.
*   **Regime de Horas:** Configuração global para optar entre pagamento de **Horas Extras** ou compensação via **Banco de Horas**.
*   **Controle de Geofencing:** Definição de raios de tolerância baseados em GPS para restringir batidas a locais autorizados.
*   **Relatórios Gerenciais:** Exportação de dashboards de absenteísmo e produtividade em PDF e Excel para análise de diretoria.
*   **Gestão de Ocorrências:** Aprovação ou rejeição de justificativas de faltas, atrasos e envio de atestados médicos pelos colaboradores.
*   **Relatórios e Compliance:**
    *   **Espelho de Ponto:** Geração do documento mensal consolidado para conferência.
    *   **Exportação AFD (Arquivo de Fonte de Dados):** Geração de arquivo padrão fiscal conforme Portaria 671.
    *   **Dashboard de BI:** Análises gráficas de absenteísmo, horas extras e média de atrasos por setor.
*   **Identidade Visual Local:** Customização da logo e interface específica para a sua empresa.

---

## 3. Perfil: Colaborador (Funcionário)
O foco deste perfil é a interface mobile-first para o registro e acompanhamento do ponto.

*   **Registro de Ponto Inteligente:** Interface simplificada com suporte a **Modo Offline** (sincronização automática) e **Lembretes Proativos** (notificações 5 min antes do horário).
*   **Comprovante de Registro:** Acesso imediato ao comprovante digital com assinatura eletrônica e hash de segurança (Portaria 671).
*   **Histórico de Pontos:** Consulta visual das batidas realizadas no mês corrente e anteriores, permitindo acompanhar o saldo de horas. 
*   **Envio de Ocorrências:** Funcionalidade para anexar fotos de atestados médicos ou inserção de justificativas para batidas esquecidas ou atrasos.
*   **Minha Jornada:** Visualização clara do seu horário de trabalho previsto e carga horária semanal/mensal.
*   **Assinatura de Espelho:** Visualização e assinatura digital do espelho de ponto mensal enviado pelo RH diretamente pelo app.
*   **Perfil e Segurança:** Gestão de dados cadastrais simplificados e alteração de senha pessoal.

---

## 4. Funcionalidades Transversais e Infraestrutura
*   **Segurança (API Sanctum):** Autenticação robusta com tokens e controle de acesso baseado em cargos (RBAC).
*   **Push Notifications:** Disparo de notificações em tempo real para alertas de ponto e comunicações do RH.
*   **Offline-First:** Suporte tecnológico para permitir o registro de ponto mesmo em áreas com oscilação de internet (Sincronização posterior).
*   **Responsividade & PWA:** Interface adaptada para uso via Browser em computadores ou instalação como aplicativo (PWA) em dispositivos móveis.
