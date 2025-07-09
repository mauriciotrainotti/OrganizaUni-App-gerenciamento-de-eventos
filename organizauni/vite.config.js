import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O nome do seu repositório GitHub, conforme a parte final da sua URL de homepage
// "https://mauriciotrainotti.github.io/OganizaUni-App-gerenciamento-de-eventos/"
const repoName = 'OganizaUni-App-gerenciamento-de-eventos';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configura a base da URL para o deploy no GitHub Pages
  // Isso garante que os caminhos dos assets (CSS, JS) sejam gerados corretamente
  base: `/${repoName}/`, // Ex: /OganizaUni-App-gerenciamento-de-eventos/
  build: {
    outDir: 'dist', // Onde o Vite vai gerar os arquivos de build
  },
});
