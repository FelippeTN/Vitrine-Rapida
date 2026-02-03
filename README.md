# Vitrine Rápida

Bem-vindo ao **Web Catálogo**! Este projeto é uma aplicação web moderna e completa para gerenciamento de catálogos de produtos, planos de assinatura e processamento de pagamentos.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando uma stack robusta e performática:

### Frontend
- **React** (com **Vite**): Para uma interface rápida e reativa.
- **TypeScript**: Garantindo segurança de tipos e melhor manutenibilidade.
- **Tailwind CSS**: Para estilização moderna e responsiva.
- **Framer Motion**: Adicionando animações fluidas e dinâmicas.
- **Lucide React**: Ícones elegantes e consistentes.
- **Stripe.js**: Integração segura de pagamentos no frontend.

### Backend
- **Go (Golang)**: Linguagem de alta performance para o servidor.
- **Gin**: Framework web rápido e minimalista para Go.
- **Gorm**: ORM para interação eficiente com o banco de dados.
- **PostgreSQL**: Banco de dados relacional confiável e robusto.
- **Stripe Go**: SDK para gerenciamento de pagamentos e assinaturas no backend.

### Infraestrutura
- **Docker** & **Docker Compose**: Para containerização e fácil orquestração do ambiente de desenvolvimento e produção.

## 📦 Estrutura do Projeto

- **/frontend**: Código fonte da aplicação cliente (React).
- **/backend**: Código fonte da API e lógica de negócios (Go).
- **docker-compose.yml**: Definição dos serviços para rodar a aplicação localmente.

## 🛠️ Como Executar

Para rodar o projeto localmente:

1. Certifique-se de ter o **Docker** e **Docker Compose** instalados em sua máquina.
2. Na raiz do projeto, execute o comando:
   ```bash
   docker-compose up --build
   ```
3. A aplicação frontend estará disponível em `http://localhost:5173` (porta padrão do Vite).
4. A API backend estará rodando na porta configurada (geralmente `8080`).

---
Desenvolvido com foco em **performance**, **escalabilidade** e uma **experiência de usuário premium**.
