# Uso de IA

Este projeto foi desenvolvido com apoio do **Claude (Anthropic)**, como permitido nas diretrizes do projeto final.

## Prompts que importaram

1. Enviei o link dos slides do projeto final (Encontro 24) e pedi ajuda para entender as exigências.
2. Pedi que a IA montasse o **Projeto B** em Node.js, no domínio de pedidos, informando que tenho GitHub, VS Code e Docker.
3. Enviei os resultados dos meus testes (npm install, lint, testes, Docker Compose) para a IA conferir se estava tudo certo.
4. Enviei o projeto pronto para uma revisão antes de subir ao GitHub.
5. Enviei um projeto antigo meu (e-commerce) para avaliar se valia trocar. A conclusão foi manter o projeto de pedidos, pois o antigo não tinha Docker, CI, métricas, SLO nem testes sem banco externo.

## O que a IA fez

- Escreveu a estrutura em camadas (domínio, serviço, repositório, API), os testes, o Dockerfile, o Docker Compose, o workflow de CI, o OpenAPI, o ADR e o script k6.
- Na revisão final, apontou problemas nos meus documentos (marcadores do modelo em CONTRIBUTORS.md e uma análise de desempenho que citava uma rota que o teste não mediu).

## O que eu fiz e decidi

- Instalei as dependências e rodei tudo na minha máquina: lint sem erros, 31 testes passando e cobertura de 99% (o mínimo exigido é 80%).
- Subi a aplicação com Docker Compose e testei com curl: criei um pedido e listei, confirmando que os dados são gravados no Postgres.
- Rodei o teste de carga k6 e registrei os resultados reais (p95 de 42 ms contra a meta de 300 ms, 0% de erros).
- Corrigi o CONTRIBUTORS.md e a análise de desempenho, que afirmava um gargalo que eu não tinha medido.
- Escolhi o domínio de pedidos e decidi manter este projeto em vez de trocá-lo pelo meu projeto antigo.
- Li o domínio, o serviço e o ADR para conseguir explicar o projeto: o pedido segue as etapas criado, pago, enviado e entregue (ou cancelado); o serviço aplica as regras; e o repositório guarda os dados, em Postgres no uso real e em memória nos testes.

## Limites

Tenho pouca experiência com programação. Por isso a IA escreveu a maior parte do código, e meu trabalho principal foi executar, testar, revisar e corrigir os documentos. Mantive tudo o que entendo e consigo explicar.