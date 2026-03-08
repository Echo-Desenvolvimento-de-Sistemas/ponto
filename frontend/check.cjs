const fs = require('fs');
const esbuild = require('esbuild');
try {
    esbuild.transformSync(fs.readFileSync('src/pages/funcionario/BaterPonto.jsx', 'utf8'), { loader: 'jsx' });
    console.log('OK');
} catch (e) {
    console.error(e.message);
}
