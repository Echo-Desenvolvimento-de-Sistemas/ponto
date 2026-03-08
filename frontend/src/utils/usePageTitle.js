import { useEffect } from 'react';

const APP_NAME = 'PontoNow';

/**
 * Define o título da aba do navegador para a página atual.
 * @param {string} pageTitle - Nome da página (ex: 'Dashboard')
 * Resultado: "Dashboard | PontoNow"
 */
const usePageTitle = (pageTitle) => {
    useEffect(() => {
        document.title = pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME;

        return () => {
            document.title = APP_NAME;
        };
    }, [pageTitle]);
};

export default usePageTitle;
