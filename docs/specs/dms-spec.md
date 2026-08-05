# Especificação - Document Management System (DMS)

> Documento de especificação funcional e técnica para implementação do DMS.
> Esta especificação respeita a Clean Architecture simples no backend e a
> restrição de armazenamento local com multer (diskStorage).

## 1. Objetivo

Entregar um sistema web simples de gestão de documentos que permita upload,
listagem e download por usuário, com persistência de arquivos no filesystem
local e metadados mantidos em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos por usuário
- Listagem de documentos por usuário
- Download de documentos por identificador
- Interface web para envio, listagem e download
- Arquitetura em camadas no backend: routes -> controllers -> services -> repositories
- Proxy de frontend para backend via /api

### Fora do escopo

- Armazenamento externo (S3, Blob, GCS ou similares)
- Banco de dados para metadados
- Versionamento de documentos
- Exclusão e edição de documentos
- Controle avançado de permissões e autenticação completa

## 3. Requisitos funcionais

| ID    | Requisito |
| ----- | --------- |
| RF-01 | O sistema deve permitir o envio de um documento por requisição HTTP. |
| RF-02 | O upload deve aceitar multipart/form-data com campo de arquivo file. |
| RF-03 | O sistema deve gravar o arquivo enviado no filesystem local em backend/storage usando multer com diskStorage. |
| RF-04 | O sistema deve gerar um identificador único para cada documento enviado. |
| RF-05 | O sistema deve registrar metadados do documento em memória após upload bem-sucedido. |
| RF-06 | O sistema deve associar cada documento a um owner informado na requisição. |
| RF-07 | O sistema deve listar somente os documentos do owner solicitante. |
| RF-08 | O sistema deve permitir download do documento por id quando o owner for compatível. |
| RF-09 | O sistema deve retornar erro quando o arquivo não for enviado no upload. |
| RF-10 | O sistema deve retornar erro quando o owner não for informado nos endpoints funcionais. |
| RF-11 | O sistema deve retornar 404 quando o documento não existir. |
| RF-12 | O sistema deve retornar 403 quando houver tentativa de acesso a documento de outro owner. |
| RF-13 | O sistema deve expor endpoint de saúde para monitoramento básico do serviço. |
| RF-14 | O frontend deve consumir a API por meio do prefixo /api (proxy Vite), sem dependência de URL hardcoded de produção. |

## 4. Requisitos não funcionais

| ID     | Requisito |
| ------ | --------- |
| RNF-01 | Backend em Node.js + Express (CommonJS). |
| RNF-02 | Frontend em React + Vite (ESM). |
| RNF-03 | Organização obrigatória do backend em camadas: routes, controllers, services e repositories. |
| RNF-04 | Fluxo de dependência obrigatório: routes -> controllers -> services -> repositories. |
| RNF-05 | Configuração por variáveis de ambiente (12-Factor), incluindo porta e parâmetros de upload. |
| RNF-06 | Persistência de metadados exclusivamente em memória nesta fase inicial. |
| RNF-07 | Tratamento de erro com respostas JSON consistentes nos limites HTTP. |
| RNF-08 | Testes de backend usando node:test. |
| RNF-09 | Código simples, legível e sem overengineering (KISS/YAGNI). |

## 5. Modelo de dados (metadados do documento)

### Entidade DocumentMetadata

| Campo        | Tipo   | Obrigatório | Descrição |
| ------------ | ------ | ----------- | --------- |
| id           | string | Sim         | Identificador único do documento. |
| originalName | string | Sim         | Nome original do arquivo enviado pelo cliente. |
| storedName   | string | Sim         | Nome do arquivo gravado no disco local. |
| size         | number | Sim         | Tamanho do arquivo em bytes. |
| mimeType     | string | Sim         | Tipo MIME do arquivo enviado. |
| uploadedAt   | string | Sim         | Data/hora do upload em ISO 8601 (UTC). |
| owner        | string | Sim         | Identificador do usuário dono do documento. |

### Regras de negócio sobre os metadados

- O metadado só deve ser salvo em memória após confirmação de gravação do arquivo em disco.
- O campo id deve ser único no repositório em memória.
- A listagem deve ser filtrada por owner.
- O download deve validar owner e existência do metadado antes da leitura do arquivo.
- Em reinício da aplicação, os metadados podem ser perdidos (comportamento esperado nesta fase).

## 6. Contratos de API

### Convenções gerais

- Prefixo de consumo no frontend: /api
- Content-Type de respostas de erro: application/json
- Header funcional obrigatório para contexto do usuário: x-owner-id
- Campos de data em ISO 8601

### 6.1 POST /upload

**Descrição:** envia um documento e retorna metadados.

**Request**

- Método: POST
- URL: /upload
- Headers:
  - x-owner-id: string (obrigatório)
- Body: multipart/form-data
  - file: binary (obrigatório)

**Resposta de sucesso**

- Status: 201 Created
- Body:

```json
{
  "id": "doc_8f6b8de4",
  "originalName": "contrato.pdf",
  "storedName": "1722859200000-contrato.pdf",
  "size": 245760,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-08-05T12:00:00.000Z",
  "owner": "user-123"
}
```

**Erros**

- 400 Bad Request
  - owner ausente
  - arquivo ausente
- 413 Payload Too Large
  - arquivo excede limite configurado
- 500 Internal Server Error
  - falha inesperada ao salvar arquivo/metadado

Exemplo de erro:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Arquivo é obrigatório"
  }
}
```

### 6.2 GET /documents

**Descrição:** lista metadados dos documentos do owner solicitante.

**Request**

- Método: GET
- URL: /documents
- Headers:
  - x-owner-id: string (obrigatório)

**Resposta de sucesso**

- Status: 200 OK
- Body:

```json
[
  {
    "id": "doc_8f6b8de4",
    "originalName": "contrato.pdf",
    "storedName": "1722859200000-contrato.pdf",
    "size": 245760,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-08-05T12:00:00.000Z",
    "owner": "user-123"
  }
]
```

**Erros**

- 400 Bad Request
  - owner ausente
- 500 Internal Server Error

### 6.3 GET /documents/:id/download

**Descrição:** faz o download do arquivo por id, com validação de owner.

**Request**

- Método: GET
- URL: /documents/:id/download
- Headers:
  - x-owner-id: string (obrigatório)

**Resposta de sucesso**

- Status: 200 OK
- Body: conteúdo binário do arquivo
- Headers esperados:
  - Content-Type: conforme mimeType
  - Content-Disposition: attachment; filename="<originalName>"

**Erros**

- 400 Bad Request
  - owner ausente
  - id inválido
- 403 Forbidden
  - owner sem permissão no documento
- 404 Not Found
  - documento inexistente
  - arquivo ausente no disco para metadado existente
- 500 Internal Server Error

### 6.4 GET /health

**Descrição:** endpoint de verificação de saúde do backend.

**Request**

- Método: GET
- URL: /health

**Resposta de sucesso**

- Status: 200 OK
- Body:

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

- Backend organizado em Clean Architecture simples:
  - routes: define endpoints e injeta dependências
  - controllers: adapta HTTP para casos de uso (entrada/saída)
  - services: aplica regras de negócio e orquestra fluxo
  - repositories: abstrai persistência (memória e filesystem)
- O controller não acessa filesystem diretamente.
- O service não conhece detalhes de Express.
- O repository não conhece req/res HTTP.
- Upload físico ocorre com multer em camada de borda HTTP (rota/controller), enquanto service/repository tratam metadados e consulta.
- Armazenamento restrito ao diretório local backend/storage.

## 8. Plano de execução em etapas

### Etapa 1 - Estrutura base e wiring de camadas

Objetivo:
- Estruturar os módulos de routes/controllers/services/repositories e integração no app.

Entregáveis:
- Rotas registradas para /health, /upload, /documents e /documents/:id/download.
- Contratos internos entre camadas definidos.

Critérios de aceite:
- Aplicação inicia sem erro.
- Fluxo de dependências respeita routes -> controllers -> services -> repositories.

### Etapa 2 - Upload com armazenamento local

Objetivo:
- Implementar upload com multer diskStorage e criação de metadados em memória.

Entregáveis:
- Configuração de storage local em backend/storage.
- Endpoint POST /upload funcional.

Critérios de aceite:
- Arquivo enviado é salvo fisicamente em backend/storage.
- Resposta 201 retorna metadados completos.
- Erros 400/413 tratados conforme contrato.

### Etapa 3 - Listagem por owner

Objetivo:
- Implementar consulta de metadados filtrada por owner.

Entregáveis:
- Endpoint GET /documents funcional.

Critérios de aceite:
- Lista retorna apenas documentos do owner informado.
- Erro 400 para owner ausente.

### Etapa 4 - Download por id com validação de owner

Objetivo:
- Implementar recuperação segura de arquivo por id.

Entregáveis:
- Endpoint GET /documents/:id/download funcional.

Critérios de aceite:
- Download retorna conteúdo binário correto e headers esperados.
- Erros 403/404 cobertos.

### Etapa 5 - Frontend e integração com backend

Objetivo:
- Construir interface de upload, listagem e download consumindo /api.

Entregáveis:
- Componentes de upload/listagem/download.
- Serviço de consumo da API com fetch.

Critérios de aceite:
- Upload atualiza listagem sem recarregar página.
- Download acionável por item listado.

### Etapa 6 - Testes e estabilização

Objetivo:
- Garantir comportamento esperado e reduzir regressões.

Entregáveis:
- Testes de backend para fluxos principais e erros.
- Ajustes de tratamento de falhas em limites do sistema.

Critérios de aceite:
- Testes passando para upload, listagem, download e cenários de erro.
- Mensagens de erro consistentes com contratos.

## 9. Critérios de pronto (Definition of Done)

- Endpoints implementados conforme contratos desta especificação.
- Arquivos armazenados localmente com multer diskStorage em backend/storage.
- Metadados em memória com modelo definido na seção 5.
- Arquitetura em camadas respeitada sem violação de dependências.
- Frontend integrado via /api.
- Testes automatizados de backend executando com sucesso.
