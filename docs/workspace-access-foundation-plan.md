# orbeAI workspace access foundation

Status: planejado
Branch: feature/workspace-access-foundation

## objetivo

A fase workspace access foundation transforma a autenticação básica da orbeAI em um sistema de acesso por workspace, papel e permissão.

A auth foundation já entrega usuários, sessões, memberships e workspace atual. Esta fase organiza o que cada usuário pode ver, criar, editar, apagar ou administrar dentro do workspace.

## princípios

- Toda ação sensível precisa considerar o usuário autenticado.
- Toda ação sensível precisa considerar o workspace atual.
- Toda permissão precisa ser explícita.
- Roles devem ser simples no início.
- O backend é a fonte de verdade.
- O frontend deve esconder ações proibidas, mas nunca substituir validação do backend.
- O primeiro usuário segue como owner.
- O sistema deve continuar simples para desenvolvimento local.

## roles iniciais

### owner

Dono do workspace.

Pode:

- Ver tudo no workspace.
- Criar, editar e apagar projetos.
- Criar, editar e apagar chats.
- Gerenciar membros.
- Alterar roles.
- Ativar/desativar membros.
- Ver auditoria.
- Alterar configurações do workspace.
- Gerenciar feature flags.

### admin

Administrador operacional.

Pode:

- Ver tudo no workspace.
- Criar, editar e apagar projetos.
- Criar, editar e apagar chats.
- Ver auditoria.
- Alterar configurações operacionais.
- Gerenciar feature flags.
- Convidar ou desativar membros, se permitido.

Não pode:

- Remover owner.
- Rebaixar owner.
- Excluir workspace.

### member

Usuário padrão.

Pode:

- Ver projetos permitidos do workspace.
- Criar chats.
- Enviar mensagens.
- Criar artifacts.
- Usar memória conforme política do workspace.

Não pode:

- Gerenciar membros.
- Alterar configurações globais.
- Ver auditoria completa.
- Alterar feature flags.

### viewer

Leitor.

Pode:

- Ver conteúdos permitidos.
- Ler chats/projetos liberados.

Não pode:

- Criar, editar ou apagar recursos.
- Enviar mensagens.
- Gerenciar membros.
- Alterar configurações.

## permissões iniciais

Permissões propostas para backend:

- workspace.read
- workspace.update
- workspace.settings.read
- workspace.settings.update
- members.read
- members.invite
- members.update_role
- members.deactivate
- projects.read
- projects.create
- projects.update
- projects.delete
- chats.read
- chats.create
- chats.update
- chats.delete
- chat.send
- artifacts.read
- artifacts.create
- artifacts.update
- artifacts.delete
- memories.read
- memories.create
- memories.update
- memories.delete
- audit.read
- feature_flags.read
- feature_flags.update
- model_runs.read
- model_providers.read

## mapa inicial role -> permissões

### owner

Todas as permissões.

### admin

Todas, exceto ações reservadas ao owner.

Reservas futuras:

- workspace.delete
- owner.transfer
- owner.remove

### member

- workspace.read
- workspace.settings.read
- projects.read
- projects.create
- projects.update
- chats.read
- chats.create
- chats.update
- chat.send
- artifacts.read
- artifacts.create
- artifacts.update
- memories.read
- memories.create
- memories.update
- model_runs.read
- model_providers.read

### viewer

- workspace.read
- workspace.settings.read
- projects.read
- chats.read
- artifacts.read
- memories.read
- model_runs.read
- model_providers.read

## entregas técnicas planejadas

### 5.1 matriz de permissões

Criar módulo backend com:

- Role enum/constantes.
- Permission enum/constantes.
- Mapa ROLE_PERMISSIONS.
- Função role_has_permission.
- Função assert_permission.

### 5.2 dependency de permissão

Criar dependency reutilizável:

- require_permission(permission)
- Usa CurrentWorkspaceContext.
- Retorna 403 quando usuário não tem permissão.

### 5.3 proteger rotas sensíveis

Aplicar permissões em:

- workspace settings
- feature flags
- audit logs
- projects
- chat send
- memories
- artifacts

### 5.4 membros do workspace

Criar endpoints:

- GET /v1/workspace/members
- PATCH /v1/workspace/members/{member_id}
- POST /v1/workspace/members/{member_id}/deactivate
- POST /v1/workspace/members/{member_id}/reactivate

Convites por email ficam para fase futura, se necessário.

### 5.5 frontend

Adicionar ao Admin:

- Aba Membros.
- Lista de membros.
- Role.
- Status.
- Ações permitidas conforme usuário atual.
- Botões escondidos quando usuário não tiver permissão.

### 5.6 testes

Testar:

- owner pode tudo.
- admin não altera owner.
- member não acessa admin sensível.
- viewer não cria recursos.
- rotas retornam 403 quando falta permissão.
- isolamento por workspace segue funcionando.

## fora do escopo desta fase

- Recuperação de senha.
- Login social.
- Convite por email com token.
- Multi-workspace visual completo.
- Billing/planos.
- Exclusão de workspace.
- Transferência de ownership.

## definição de pronto

A fase fica pronta quando:

- Backend possui matriz de roles/permissões.
- Rotas sensíveis usam permissões.
- Endpoints de membros existem.
- Admin exibe membros reais.
- Logout/login seguem funcionando.
- Testes backend passam.
- Typecheck/build frontend passam.
- Documentação de release interna criada.
