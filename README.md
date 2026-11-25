# AgendaVet

API para marcar atendimentos em clínicas veterinárias, desenvolvida no Projeto Prático 1 de Engenharia de Software II (Partes 1 e 2).

**Autores** · Davi Dutra Satler e Willian Valadares Ramos Júnior.

[Código no GitHub](https://github.com/DaviSatler/AgendaVet)

Esta versão serve como referência técnica e passou por revisão com IA. Na disciplina, a avaliação depende do desenvolvimento e dos registros feitos pela própria dupla em laboratório. A correspondência com os roteiros está em [CHECKLIST.md](CHECKLIST.md).

## Como rodar

Baixe o repositório por clone ou extraia o ZIP do projeto. É necessário ter Node.js 20 ou mais recente.

```sh
npm ci
npm run dev:parte1
npm test
npm run test:coverage
npm run dev
```

- `dev:parte1` executa uma demonstração com três atendimentos: consulta de R$ 120,00, vacina com Plano Pet+ de R$ 64,00 e banho e tosa de R$ 65,00.
- `dev` sobe a API da Parte 2 em `http://localhost:3000`. Para rodar o JavaScript compilado, use `npm run build` e depois `npm start`.
- `node scripts/validar-local.cjs` refaz a instalação a partir do lockfile, executa a demonstração, confere o núcleo, compila o projeto e roda o Jest com cobertura. Inclua `--docker` se o Docker estiver ativo.

## API REST

| Método | Recurso | Sucesso | Erros possíveis |
|---|---|---|---|
| POST | `/consultas` | 201 · consulta criada | 400 · problemas de validação listados em `erros` |
| GET | `/consultas` | 200 · lista de consultas | |
| GET | `/consultas/:id` | 200 · consulta encontrada | 400 · ID inválido, 404 · consulta não existe |
| DELETE | `/consultas/:id` | 200 · consulta cancelada, com `taxaCancelamento` | 400 · ID inválido, 404 · consulta não existe, 409 · já estava cancelada |

Exemplo de corpo para `POST /consultas` (a data precisa estar no futuro):

```json
{
  "tutor": "Ana",
  "telefone": "31999990000",
  "pet": "Thor",
  "tipo": "CONSULTA",
  "dataHora": "2030-01-10T14:00:00-03:00",
  "planoPetMais": true
}
```

Regras de validação: o tutor deve ter ao menos três caracteres; o telefone, 10 ou 11 dígitos; o pet precisa de um nome; o tipo deve ser um dos cadastrados; e a data deve estar em formato ISO válido e ser futura. O campo do plano é booleano e, se omitido, vale `false`. Campos adicionais, como `valor` e `status`, são descartados. Os dados ficam apenas em memória, e o Adapter se conecta a uma SDK que imita o envio de notificações pelo console.

| Antecedência do cancelamento | Taxa sobre o valor da consulta |
|---|---|
| 24 horas ou mais | 0% |
| A partir de 2 horas e abaixo de 24 horas | 30% |
| Acima de 0 e abaixo de 2 horas | 50% |
| No horário marcado ou depois dele | 100% |

Quem tem o Plano Pet+ recebe 20% de desconto no atendimento e paga só metade da taxa calculada sobre o valor agendado. Exemplo: uma consulta Pet+ sai por R$ 96,00, e, se for cancelada com uma hora de antecedência, a taxa é de R$ 24,00.

## Arquitetura

- `domain/` contém os tipos de atendimento e os contratos da consulta.
- `pricing/` reúne as regras de preço, uma por tipo (consulta, vacina, cirurgia e banho e tosa), usando polimorfismo. `DescontoPlanoPet` funciona como decorator e pode envolver qualquer regra. `CalculadoraDeTaxaCancelamento` trata as faixas de antecedência.
- `repositories/` separa o contrato de persistência de sua implementação em memória, baseada em `Map` com um contador de IDs.
- `notifications/` faz a ponte entre o contrato `INotificador` e a SDK legada, convertendo a chamada e adicionando o DDI 55.
- `facade/` centraliza o fluxo de agendar e cancelar. `montagem.ts` cria os objetos e injeta as dependências.
- `app.ts` monta o app Express sem ocupar nenhuma porta, enquanto `index.ts` o coloca no ar na porta 3000. `legado/` guarda o código original, para fins de comparação.

Para suportar `BANHO_TOSA`, basta mexer em `TipoAtendimento.ts`, `regras.ts` e `montagem.ts`. A calculadora escolhe a regra de qualquer tipo registrado.

## Docker

Com o Docker ativo, execute na pasta do projeto:

```sh
docker build -t agendavet .
docker run --rm -p 3000:3000 agendavet
```

Em outro terminal, faça uma requisição à API:

```sh
curl http://localhost:3000/consultas
```

Num container recém-criado, a resposta é HTTP 200 com a lista vazia `[]`. A imagem parte de `node:20-alpine`, instala as dependências pelo lockfile, compila o TypeScript e roda `dist/index.js`.

## Verificação de 24 de novembro de 2026

| Item verificado | Resultado |
|---|---|
| `npm ci` e compilação do TypeScript | Aprovados |
| Demonstração e conferência independente do núcleo | 3 agendamentos e 34 checagens aprovados |
| Jest | 4 suítes e 49 testes aprovados |
| Testes por área | 12 de taxa, 10 de Facade, 21 de API e 6 de preço |
| Docker Engine 29.5.2 em VM com Alpine Linux | Imagem gerada e container rodando na porta 3000. `GET /consultas` devolveu HTTP 200 com `[]`. |

| Cobertura do Jest | Instruções | Ramificações | Funções | Linhas |
|---|---:|---:|---:|---:|
| `src/pricing/` | 100% | 100% (16/16) | 100% | 100% |
| `src/facade/` | 100% | 100% (11/11) | 100% | 100% |

O Jest cobra um mínimo de 80% de ramificações por pasta, e o relatório HTML sai em `coverage/lcov-report/index.html`. Numa medição à parte de `app.ts`, o teste com JSON malformado exercitou a resposta HTTP 400 do middleware, elevando a cobertura de ramificações da API de 89,74% para 92,30%. Há ainda um teste que cobre, pela API, o cancelamento com taxa de uma consulta Pet+.

Os registros dessa execução ficam em [evidencias/](evidencias/). O [teste HTTP no container](evidencias/docker-http.txt) também conferiu a criação, a busca por ID, o cancelamento com taxa e a recusa de um segundo cancelamento. Uma [cópia do relatório HTML](evidencias/cobertura-html/index.html) vai junto no pacote.
