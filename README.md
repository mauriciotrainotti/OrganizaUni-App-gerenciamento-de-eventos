# OrganizaUni - Plataforma de Gerenciamento de Eventos Acadêmicos 🎓

> Uma plataforma web, desenvolvida em React e Firebase, criada para centralizar e organizar todos os eventos de um campus acadêmico.

## 💡 Origem do Projeto

Este projeto nasceu como uma solução prática para um desafio real no IFRS - Campus Sertão, a pedido de um professor. O objetivo era criar uma ferramenta para substituir os métodos descentralizados de divulgação de eventos (murais físicos, grupos de WhatsApp, redes sociais) por um portal único, oficial e de fácil acesso para todos os alunos e organizadores.

## ✨ Funcionalidades Principais

A plataforma é dividida em duas grandes áreas:

#### Painel Administrativo (Organizadores)
- **Criação e Edição de Eventos:** Formulário completo para cadastrar todos os detalhes de um evento.
- **Gestão de Inscritos:** Visualização de todos os participantes inscritos em cada evento.
- **Controle de Presença:** Funcionalidade para marcar a presença dos participantes durante o evento.
- **Publicação:** Controle total sobre a visibilidade dos eventos para os alunos (Rascunho, Publicado, Encerrado).

#### Portal do Participante (Alunos)
- **Visualização de Eventos:** Um feed com cards de todos os eventos disponíveis e abertos para inscrição.
- **Inscrição Simplificada:** Formulário rápido para garantir a vaga nos eventos de interesse.
- **Detalhes do Evento:** Modal com todas as informações: descrição, data, local, palestrantes e vagas restantes.


## 🛠️ Tecnologias Utilizadas

A arquitetura do projeto é baseada em tecnologias modernas e eficientes, com o Firebase atuando como um poderoso "Backend as a Service".

- **Front-End:**
  - **[React.js](https://react.dev/):** Biblioteca principal para a construção de toda a interface de usuário reativa.
  - **[React Router](https://reactrouter.com/):** Para gerenciar a navegação e as rotas da aplicação (ex: `/admin`, `/participante`).

- **Back-End & Infraestrutura (BaaS):**
  - **[Firebase](https://firebase.google.com/):** Plataforma utilizada para todas as operações de back-end.
    - **Firestore Database:** Banco de Dados NoSQL em tempo real para armazenar todos os dados de eventos, inscrições e usuários.
    - **Firebase Authentication:** Sistema completo para autenticação de usuários, incluindo login com E-mail/Senha e provedores como o Google.

- **Estilização:**
  - **CSS Puro:** Estilização feita com CSS padrão para total controle do design.

## 🚀 Como Executar o Projeto

**Pré-requisitos:** Você vai precisar ter o [Node.js](https://nodejs.org/en) instalado e uma conta no [Firebase](https://firebase.google.com/) para configurar o projeto.

**1. Clone o repositório:**
```bash
git clone [https://github.com/mauriciotrainotti/OganizaUni-App-gerenciamento-de-eventos.git](https://github.com/mauriciotrainotti/OganizaUni-App-gerenciamento-de-eventos.git)
```

**2. Acesse a pasta do projeto:**
```bash
cd OganizaUni-App-gerenciamento-de-eventos
```

**3. Instale as dependências:**
```bash
npm install
```


**4. Inicie a aplicação:**
```bash
npm run dev
```
Após executar os comandos, o projeto estará disponível no seu navegador em `http://localhost:3000`.

## 👨‍💻 Autor
**Maurício Trainotti**
- [LinkedIn](https://www.linkedin.com/in/mauriciotrainotti/)
- [GitHub](https://github.com/mauriciotrainotti)
