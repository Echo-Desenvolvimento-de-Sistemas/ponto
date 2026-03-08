import React from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, MapPin, Database, Lock, UserCheck, Mail,
    ArrowLeft, Fingerprint, Calendar, Info, CheckCircle2,
    Eye, Trash2, Edit3, Download, AlertTriangle, Clock
} from 'lucide-react';
import './PrivacidadeLocalizacao.css';

const PrivacidadeLocalizacao = () => {
    const ultimaAtualizacao = '04 de março de 2026';

    return (
        <div className="privacidade-wrapper">

            {/* ---- Header ---- */}
            <header className="priv-header">
                <Link to="/login" className="priv-header-brand">
                    <div className="priv-header-brand-icon">
                        <Fingerprint size={20} />
                    </div>
                    <span className="priv-header-brand-name">PontoNow</span>
                </Link>
                <Link to="/login" className="priv-header-back">
                    <ArrowLeft size={16} />
                    Voltar ao Login
                </Link>
            </header>

            {/* ---- Hero Banner ---- */}
            <section className="priv-hero">
                <div className="priv-hero-icon">
                    <Shield size={36} />
                </div>
                <h1>Privacidade &amp; Localização</h1>
                <p>
                    Saiba exatamente quais dados coletamos, por que usamos sua localização e
                    como protegemos suas informações de acordo com a LGPD.
                </p>
                <div className="priv-hero-meta">
                    <Calendar size={14} />
                    Última atualização: {ultimaAtualizacao}
                </div>
            </section>

            {/* ---- Conteúdo Principal ---- */}
            <main className="priv-content">

                {/* Table of Contents */}
                <nav className="priv-toc" aria-label="Sumário">
                    <h2>Sumário</h2>
                    <ol>
                        <li><a href="#dados-coletados">1. Dados Coletados</a></li>
                        <li><a href="#uso-localizacao">2. Por Que Usamos Sua Localização</a></li>
                        <li><a href="#armazenamento">3. Armazenamento e Segurança</a></li>
                        <li><a href="#compartilhamento">4. Compartilhamento de Dados</a></li>
                        <li><a href="#retencao">5. Retenção dos Dados</a></li>
                        <li><a href="#seus-direitos">6. Seus Direitos (LGPD)</a></li>
                        <li><a href="#contato">7. Contato e DPO</a></li>
                    </ol>
                </nav>

                {/* Seção 1 — Dados Coletados */}
                <section id="dados-coletados" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon purple">
                            <Database size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 01</div>
                            <h2>Dados Coletados</h2>
                        </div>
                    </div>
                    <p>
                        Para que o sistema de ponto eletrônico funcione corretamente e em conformidade
                        com a legislação trabalhista brasileira, coletamos os seguintes dados durante
                        o uso do aplicativo:
                    </p>
                    <ul className="priv-data-list">
                        <li>
                            <span className="priv-data-list-icon"><MapPin size={18} /></span>
                            <div>
                                <strong>Localização (GPS):</strong> latitude e longitude no momento
                                exato do registro do ponto. Coletada apenas ao bater ponto.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Clock size={18} /></span>
                            <div>
                                <strong>Horário do dispositivo:</strong> o timestamp local do seu
                                aparelho no momento do registro, comparado ao horário do servidor.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Shield size={18} /></span>
                            <div>
                                <strong>Hash AFD:</strong> assinatura digital que garante a
                                integridade e autenticidade de cada registro de ponto (exigência legal).
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Info size={18} /></span>
                            <div>
                                <strong>Status de conectividade:</strong> se o registro foi feito
                                online ou offline, para fins de sincronização automática posterior.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><UserCheck size={18} /></span>
                            <div>
                                <strong>Dados de identificação:</strong> nome, e-mail, CPF e vínculo
                                com a empresa — fornecidos no cadastro pelo RH da sua organização.
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Seção 2 — Uso da Localização */}
                <section id="uso-localizacao" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon blue">
                            <MapPin size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 02</div>
                            <h2>Por Que Usamos Sua Localização</h2>
                        </div>
                    </div>
                    <p>
                        A coleta de localização via GPS é necessária para validar que o registro de
                        ponto está sendo feito no local de trabalho correto — prática conhecida como
                        <strong> Geofence (Cerca Digital)</strong>.
                    </p>
                    <div className="priv-info-box">
                        <Info size={18} />
                        <span>
                            <strong>Importante:</strong> a localização é coletada <em>exclusivamente</em> no
                            momento em que você clica em Entrada, Saída, Início ou Fim de Intervalo.
                            O aplicativo <strong>não monitora sua localização continuamente</strong> em segundo plano.
                        </span>
                    </div>
                    <p>
                        As finalidades do uso da sua localização são:
                    </p>
                    <ul className="priv-data-list">
                        <li>
                            <span className="priv-data-list-icon"><CheckCircle2 size={18} /></span>
                            <div>
                                <strong>Validação de presença:</strong> verificar se você está dentro
                                do perímetro (raio) definido pelo seu empregador como local de trabalho.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><AlertTriangle size={18} /></span>
                            <div>
                                <strong>Alertas de geofence:</strong> caso o registro seja feito fora
                                da área permitida, um alerta é gerado para análise pelo RH — você é
                                avisado imediatamente na tela.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Shield size={18} /></span>
                            <div>
                                <strong>Auditoria e conformidade legal:</strong> a localização é
                                armazenada junto ao registro para fins de auditoria trabalhista, conforme
                                exigido pela Portaria MTE nº 671/2021.
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Seção 3 — Armazenamento */}
                <section id="armazenamento" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon green">
                            <Lock size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 03</div>
                            <h2>Armazenamento e Segurança</h2>
                        </div>
                    </div>
                    <p>
                        Seus dados são armazenados em servidores seguros com as seguintes garantias:
                    </p>
                    <ul className="priv-data-list">
                        <li>
                            <span className="priv-data-list-icon"><Lock size={18} /></span>
                            <div>
                                <strong>Transmissão criptografada (HTTPS/TLS):</strong> toda comunicação
                                entre seu dispositivo e nossos servidores é cifrada.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Shield size={18} /></span>
                            <div>
                                <strong>Hash AFD:</strong> cada registro recebe uma assinatura digital
                                imutável, impedindo alterações retroativas nos dados de ponto.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Database size={18} /></span>
                            <div>
                                <strong>Isolamento por empresa (multi-tenant):</strong> seus dados
                                estão segmentados por empresa e não são acessíveis por outras organizações
                                na plataforma.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><CheckCircle2 size={18} /></span>
                            <div>
                                <strong>Armazenamento offline local:</strong> quando sem conexão, os
                                registros ficam temporariamente no dispositivo via IndexedDB e são
                                sincronizados automaticamente na próxima conexão.
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Seção 4 — Compartilhamento */}
                <section id="compartilhamento" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon orange">
                            <Eye size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 04</div>
                            <h2>Compartilhamento de Dados</h2>
                        </div>
                    </div>
                    <p>
                        <strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong> O
                        compartilhamento ocorre apenas nas seguintes situações:
                    </p>
                    <ul className="priv-data-list">
                        <li>
                            <span className="priv-data-list-icon"><UserCheck size={18} /></span>
                            <div>
                                <strong>Seu empregador (empresa contratante):</strong> os gestores e o
                                setor de RH da sua empresa têm acesso aos seus registros de ponto —
                                pois é a finalidade do sistema.
                            </div>
                        </li>
                        <li>
                            <span className="priv-data-list-icon"><Shield size={18} /></span>
                            <div>
                                <strong>Obrigação legal:</strong> podemos compartilhar dados com
                                autoridades competentes quando exigido por lei ou ordem judicial.
                            </div>
                        </li>
                    </ul>
                </section>

                {/* Seção 5 — Retenção */}
                <section id="retencao" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon pink">
                            <Clock size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 05</div>
                            <h2>Retenção dos Dados</h2>
                        </div>
                    </div>
                    <p>
                        Os registros de ponto são mantidos por no mínimo <strong>5 anos</strong>, conforme
                        determina a Portaria MTE nº 671/2021 (Registrador Eletrônico de Ponto — REP-C).
                    </p>
                    <p>
                        Após o encerramento do vínculo empregatício ou do contrato da empresa com a plataforma,
                        os dados são mantidos pelo período legal mínimo e após isso poderão ser anonimizados
                        ou excluídos mediante solicitação formal, respeitando os prazos legais.
                    </p>
                </section>

                {/* Seção 6 — Direitos LGPD */}
                <section id="seus-direitos" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon teal">
                            <UserCheck size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 06</div>
                            <h2>Seus Direitos (LGPD)</h2>
                        </div>
                    </div>
                    <p>
                        De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui
                        os seguintes direitos em relação aos seus dados pessoais:
                    </p>
                    <div className="priv-rights-grid">
                        <div className="priv-right-card">
                            <h4><Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />Acesso</h4>
                            <p>Solicitar uma cópia dos seus dados pessoais armazenados.</p>
                        </div>
                        <div className="priv-right-card">
                            <h4><Edit3 size={14} style={{ display: 'inline', marginRight: '4px' }} />Correção</h4>
                            <p>Solicitar a correção de dados incompletos ou desatualizados.</p>
                        </div>
                        <div className="priv-right-card">
                            <h4><Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} />Exclusão</h4>
                            <p>Solicitar a exclusão de dados desnecessários (respeitando prazos legais).</p>
                        </div>
                        <div className="priv-right-card">
                            <h4><Download size={14} style={{ display: 'inline', marginRight: '4px' }} />Portabilidade</h4>
                            <p>Receber seus dados em formato estruturado e interoperável.</p>
                        </div>
                        <div className="priv-right-card">
                            <h4><Info size={14} style={{ display: 'inline', marginRight: '4px' }} />Informação</h4>
                            <p>Obter informações sobre com quem seus dados foram compartilhados.</p>
                        </div>
                        <div className="priv-right-card">
                            <h4><Shield size={14} style={{ display: 'inline', marginRight: '4px' }} />Revogação</h4>
                            <p>Revogar consentimentos dados para uso de dados não essenciais.</p>
                        </div>
                    </div>
                    <div className="priv-info-box" style={{ marginTop: '1.25rem' }}>
                        <Info size={18} />
                        <span>
                            Para exercer seus direitos, entre em contato com o setor de RH da sua empresa
                            ou diretamente com o DPO do sistema pelo canal abaixo.
                        </span>
                    </div>
                </section>

                {/* Seção 7 — Contato */}
                <section id="contato" className="priv-section">
                    <div className="priv-section-header">
                        <div className="priv-section-icon purple">
                            <Mail size={22} />
                        </div>
                        <div className="priv-section-title">
                            <div className="priv-section-number">Seção 07</div>
                            <h2>Contato e DPO</h2>
                        </div>
                    </div>
                    <p>
                        Caso tenha dúvidas sobre esta política, queira exercer seus direitos ou reportar
                        algum incidente relacionado à proteção de dados, entre em contato:
                    </p>
                    <div className="priv-contact-box">
                        <div className="priv-contact-icon">
                            <Mail size={24} />
                        </div>
                        <div className="priv-contact-info">
                            <h3>Encarregado de Dados (DPO)</h3>
                            <p>
                                E-mail: <a href="mailto:privacidade@pontonow.com.br">privacidade@pontonow.com.br</a>
                                <br />
                                Respondemos em até 15 dias úteis conforme exigido pela LGPD.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="priv-footer">
                    <p>
                        Esta política foi atualizada em {ultimaAtualizacao}.{' '}
                        Alterações significativas serão comunicadas por e-mail.
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        <Link to="/login">← Voltar para o Login</Link>
                        {' · '}
                        <a href="mailto:privacidade@pontonow.com.br">Falar com o DPO</a>
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default PrivacidadeLocalizacao;
