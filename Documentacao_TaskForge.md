# Documentação Técnica do TaskForge

Este documento detalha o funcionamento interno de todos os componentes e arquivos principais do sistema TaskForge (antigo Datewise), criado em React + Vite utilizando Supabase como backend.

---

## 1. Núcleo da Aplicação (`src/App.jsx` e `src/main.jsx`)

### `src/main.jsx`
É o ponto de entrada da aplicação React. Ele pega a div com `id="root"` no HTML e renderiza o componente `<App />` lá dentro.

### `src/App.jsx`
É o coração do sistema. Gerencia rotas, estado de autenticação e temas.
- **Função `App`:** Observa o Supabase para saber se o usuário está logado (`getSession`). Se não estiver, redireciona para `/login`. Se estiver, carrega o `<MainApp />`.
- **Função `MainApp`:** É a estrutura da tela quando logado. Ela controla o menu lateral, a barra superior de busca e decide se a tela do meio vai mostrar a `Overview` (visão de setores), o `Board` (quadro Kanban) ou o Calendário.
- **Função `handleClickOutside`:** Verifica se você clicou fora do menu de perfil para fechá-lo.
- **Função `handleBgChange`:** Escuta o evento de troca de papel de parede (que vem da Sidebar ou do menu de Settings) e aplica a nova cor ou foto de fundo nas áreas transparentes da tela.

---

## 2. Autenticação e Login (`src/components/Login.jsx`)

Lida com a entrada de usuários.
- **Função `handleAuth`:** Impede que a página recarregue ao clicar no botão. Verifica se você está tentando "Entrar" (SignIn) ou "Cadastrar" (SignUp) e manda os dados de email e senha para o Supabase de forma segura. Em caso de erro, exibe mensagens em vermelho.

---

## 3. Visão Geral / Múltiplos Quadros (`src/components/Overview.jsx`)

É a tela inicial que mostra os seus "Grupos" ou "Setores".
- **Função `fetchBoards`:** Consulta o Supabase e traz todos os quadros (grupos) atrelados ao seu `user.id`.
- **Função `handleCreateBoard`:** Acionada ao clicar em "Criar Novo Grupo". Ela insere um novo Quadro no banco e, logo em seguida, cria automaticamente as 3 colunas base ("A Fazer", "Em Andamento" e "Concluído") para que o grupo não fique vazio.

---

## 4. O Kanban em Si (`src/components/Board.jsx`)

Responsável por desenhar as colunas e a área de "Arrastar e Soltar" (Drag and Drop).
- **Função `fetchBoardData`:** Uma das funções mais complexas. Ela pega o ID do quadro atual, puxa todas as Colunas (`lists`) dele e depois todos os Cartões (`cards`) atrelados àquelas colunas, organizando-os perfeitamente na ordem correta para exibição.
- **`useEffect` do Supabase Realtime:** Ele se inscreve no canal do Supabase (`supabase.channel`) para ouvir mudanças. Se outra pessoa arrastar um cartão ou adicionar algo, ele dá um *refresh* na tela quase em tempo real.
- **Função `onDragEnd`:** É chamada quando o usuário solta um cartão que estava arrastando. Ela recalcula a posição no frontend (para não ter lentidão/loading) e manda o Supabase atualizar o banco em segundo plano. Se soltar na coluna "Concluído", ela dispara a função `confetti()` que lança papel picado!
- **Funções Otimistas (`handleAddCard`, `handleEditCard`, `handleDeleteCard`):** Elas adicionam as tarefas na tela *imediatamente* usando um ID temporário, e só depois falam com o Supabase. Isso faz o site parecer ultrarrápido (Zero Delay).

---

## 5. Colunas (`src/components/List.jsx`)

Representa as listas cinzas do Kanban.
- É envolta pelo `Droppable` (que permite que cartões sejam soltos nela).
- Renderiza todos os `Card` que pertencem a ela usando um map do React.
- Lida com a criação de uma nova tarefa (abrir o campinho de texto e apertar Enter).

---

## 6. Tarefa Individual (`src/components/Card.jsx`)

O retângulo branco clicável.
- Envolto em um `Draggable` (o que permite ser arrastado pela tela).
- Previne que cliques rápidos sejam confundidos com arrastos (usando `e.stopPropagation()` no botão de três pontinhos).
- Tem um mini-menu que permite Editar Rápido o título ou Deletar o cartão direto da tela principal.

---

## 7. Detalhes Profundos da Tarefa (`src/components/CardDetailModal.jsx`)

É o pop-up grande que aparece quando você clica numa tarefa.
- **Função `onBlur` na Descrição e Título:** É a lógica do "Auto-Save". Em vez de ter um botão de "Salvar Alterações", assim que você tira o mouse da caixa de texto (blur), a função é chamada e manda a alteração direto pro Supabase, garantindo que nada se perca.
- **Datas (`due_date`):** Permite configurar prazos para a tarefa.
- **Chat/Comentários (`handleAddComment`):** Salva o que a equipe escreve. O estado fica escutando mudanças para aparecer na hora para os demais.

---

## 8. Alertas (`src/components/MeetingAlert.jsx`)

A barra de notificação laranja que aparece no topo da tela.
- Lê as tarefas e filtra aquelas que são do tipo "Reunião" e verifica se o `due_date` (prazo) está marcado para *amanhã*. Se for verdadeiro, ele exibe um aviso global na tela para que ninguém perca o horário.

---

## 9. Menu Lateral (`src/components/Sidebar.jsx`)

O menu do lado esquerdo da tela principal.
- **Função `toggleDarkMode`:** Muda a classe global `body.dark`, invertendo todas as variáveis de cor (Branco vira Azul Marinho Escuro). Também salva a preferência no seu navegador via `localStorage`.
- **Função `handleThemeChange`:** Envia um evento `bg-changed` para toda a aplicação. As bolinhas de cores enviam um código de cor para esse evento, que é ouvido pelo `App.jsx` para pintar o fundo gigante da tela de verde, azul, laranja, etc.

---

## 10. Configurações (`src/components/SettingsModal.jsx`)

Pop-up acessado pelo menu inferior esquerdo "Settings".
- **Aba "Aparência" / `handleSaveBackground`:** Permite clicar em papéis de parede baseados em fotografias (Montanhas, Abstrato). Diferente de uma cor sólida, ele envia a instrução `url("imagem.jpg")` para o `App.jsx`, que renderiza o papel de parede e embassa os quadros por cima (Glassmorphism).

---

## 11. O Banco de Dados (`supabase/schema.sql` e `src/lib/supabase.js`)

- **`supabase.js`:** Puxa a chave da sua API que está guardada no arquivo `.env` para conseguir falar com segurança com seu projeto Supabase. É ele quem faz a "ponte".
- **`schema.sql`:** É a "planta baixa" da casa. Ali está escrito que a tabela `boards` deve guardar o *nome* do grupo. Que a `cards` deve guardar o *ID da lista*, o *Título*, a *Data (`due_date`)*, etc.
