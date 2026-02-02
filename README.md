# Inventory Screen - Interface de Gestão de Inventário

O Inventory Screen é uma interface moderna e responsiva projetada para tornar a atulalização de estoque rápida. O foco do projeto é oferecer uma experiência de usuário fluida para operações de busca, edição e monitoramento de itens em tempo real.

---

A aplicação nasceu da necessidade de gerenciar grandes volumes de dados de inventário (SKUs) de forma intuitiva. A interface permite que gestores visualizem informações críticas e realizem atualizações rápidas, garantindo que o estoque físico e o digital estejam sempre em sincronia.

## Escopo do Projeto

Este repositório contém exclusivamente o **Frontend** da aplicação.

A arquitetura foi desenhada para ser totalmente desacoplada, funcionando como um cliente agnóstico que consome uma API REST independente. Toda a lógica de persistência, regras de negócio e validações de banco de dados residem em um serviço de backend separado.

## Stack

- **React**: Construção de componentes dinâmicos.
- **TypeScript**: Segurança e previsibilidade no fluxo de dados.
- **Vite**: Ferramenta de build otimizada para performance.
- **Fetch API**: Integração assíncrona com serviços externos.

---

## Integração com API

Para o funcionamento pleno, esta interface espera uma API que forneça os seguintes recursos:

- `GET /items`: Listagem de produtos.
- `GET /items/{sku}`: Busca detalhada por identificador único.
- `PUT /items/{sku}`: Atualização de dados cadastrais e preços.

---

## Integração com a API

A interface está configurada para consumir os recursos da API hospedada no endereço abaixo:

- **Endpoint Base:** `http://localhost:8080`
- **Repositório da API:** https://github.com/arthurRocha01/product-information-service

> **Nota:** Caso a API esteja rodando em um servidor de produção, altere a variável de ambiente no arquivo `vite.config.ts` para apontar para a URL correta.

---

## Como Executar

1. Clone este repositório.
2. Certifique-se de que o seu serviço de API local ou remoto esteja ativo.
3. Instale as dependências: `npm install`.
4. Inicie o ambiente de desenvolvimento: `npm run dev`.

---

Desenvolvido para máxima eficiência na gestão de dados.
