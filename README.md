# Optima Retail

A full-stack application for ingesting, enriching and exploring news articles using AI.

This project was developed as part of a technical assessment and demonstrates the design of a scalable backend API, AI-powered article enrichment, Boolean search capabilities, and a React-based user interface.

---

## Features

- RESTful API built with NestJS
- PostgreSQL database
- AI-powered article enrichment
- Boolean search support
- Article statistics and aggregation
- Swagger API documentation
- Dockerized development environment
- Automated database seeding

---

## Tech Stack

### Backend

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Docker

### Frontend

- React
- Vite
- TypeScript
- React Router
- Axios
- Tailwind CSS
- shadcn/ui
- Vitest
- React Testing Library

### AI

- Anthropic Claude Haiku 4.5

---

## Project Structure

```text
optima-retail/
│
├── backend/             # NestJS REST API
├── frontend/            # React application
├── docs/                # Images, postman collections and IA chats reports
│
├── .env.template        # Environment variables template for PostgreSQL
├── .gitignore
├── docker-compose.yml   # PostgreSQL Docker configuration
└── README.md
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone git@github.com:victorgraciaweb/optima-retail.git

cd optima-retail
```

---

## 2. Configure environment variables

Copy the environment template.

```bash
cp backend/.env.template backend/.env
cp frontend/.env.template frontend/.env
cp .env.template .env
```

Copy the `.env` files with your local configuration.

---

## 3. Install dependencies

### Backend

```bash
cd backend

yarn install
```

### Frontend

```bash
cd ../frontend

npm install
```

---

## 4. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

---

## 5. Start the Backend

```bash
cd backend

yarn start:dev
```

Backend:

```
http://localhost:3000
```

---

## 6. Start the Frontend

```bash
cd frontend

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# Database Seed

Populate the database with sample articles.

```bash
cd backend
npm run seed
```

---

# API Documentation

Swagger documentation is available after starting the backend.

GET http://localhost:3000/api/docs

The documentation includes all available endpoints, request bodies and response schemas.

![alt text](docs/images/swagger.png)

---

# Health Check

Verify that the backend is running correctly.

GET http://localhost:3000/api/health

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-07-22T18:30:15.123Z",
  "uptime": 452.81
}
```

---

# Running Tests (only Backend)

Run all tests.

```bash
yarn test
```

Run tests with coverage.

```bash
yarn test:cov
```

---

# Development Notes

This repository is organized as a full-stack application with independent backend and frontend projects orchestrated through Docker Compose.

The solution follows modern engineering practices including:

- Modular architecture
- Environment-based configuration
- Dockerized development
- API-first design
- Automatic database seeding
- Interactive API documentation

---

# Plan

Before writing any code I divided the assignment into independent milestones, prioritizing the parts with the highest technical risk.

## Development plan

1. Prepare the project structure
   - Backend
   - Frontend
   - Docker
   - PostgreSQL
   - Environment configuration

2. Design the database schema
   - Article entity
   - Indexes
   - Seed process

3. Implement data ingestion
   - Import the provided JSON dataset
   - Make the seed repeatable

4. Implement the REST API
   - Article listing
   - Filtering
   - Aggregation endpoint

5. Implement Boolean Search
   - Query parser
   - PostgreSQL Full Text Search
   - Phrase search
   - Wildcards
   - Nested expressions

6. Implement AI enrichment
   - LLM abstraction
   - Anthropic integration
   - Mock implementation
   - Cost guardrails

7. Build the frontend
   - Search page
   - Aggregate view
   - API integration

8. Testing and final review

## Prioritization

The backend was intentionally implemented first because it represents the largest technical complexity of the assignment. Once the API was stable, the frontend was developed as a thin client consuming those endpoints.

## If time became limited

The frontend would have been simplified before compromising backend quality.

The evaluation criteria place greater emphasis on architecture, SQL performance, AI reasoning and engineering decisions than on visual polish.

---

# Architecture & Decisions

## Technology Stack

### Backend

NestJS was selected because it provides a modular architecture, dependency injection, excellent TypeScript support and fits well for building maintainable REST APIs.

### Frontend

React with Vite was chosen for its fast development experience and simplicity. React Router handles navigation while Axios is responsible for API communication.

### Database

PostgreSQL was selected because it provides:

- Full Text Search
- Excellent indexing capabilities
- Strong aggregation support
- Mature production performance

These features make it particularly suitable for media search applications.

---

## Database Design

The solution stores each article together with the metadata generated by the LLM.

The schema was designed to efficiently support:

- Date filtering
- Source filtering
- Language filtering
- Full text search
- Aggregation queries

---

## Indexing Strategy

Several indexes were added to support the expected query patterns.

- B-Tree index on publication date
- B-Tree index on source
- B-Tree index on language
- GIN index on the generated search vector

The GIN index enables efficient Full Text Search while the remaining indexes optimize filtering operations.

---

## Pagination

Deep OFFSET pagination becomes increasingly expensive as datasets grow.

For this reason the API uses cursor/keyset pagination, allowing consistent performance regardless of dataset size.

---

## Boolean Search

Boolean search was implemented using PostgreSQL Full Text Search combined with a lightweight parser.

Supported features include:

- AND
- OR
- AND NOT
- Nested parentheses
- Phrase search
- Prefix wildcard

This approach leverages PostgreSQL's optimized search engine instead of implementing a custom inverted index.

---

## AI Enrichment

The LLM integration is isolated behind a dedicated service interface.

This makes it possible to switch between:

- Anthropic API
- Mock implementation

without changing the rest of the application.

---

# LLM Cost Analysis

## Model selection

The project uses **Claude Haiku 4.5** through the Anthropic API to enrich each article with:

- A 1–2 sentence summary
- A sentiment classification (`positive`, `negative`, `neutral`, `mixed`)
- 1–3 topic tags

Claude Haiku 4.5 was selected because it offers an excellent balance between:

- **Quality**: Produces consistent summaries and classifications with structured JSON output.
- **Latency**: Fast enough for high-volume ingestion pipelines.
- **Cost**: Significantly cheaper than larger models while providing sufficient quality for this task.

For this use case, using a larger model (e.g. Claude Sonnet) would increase inference costs with little practical improvement in the generated metadata.

---

## Cost guardrails

Several mechanisms were implemented to keep inference costs predictable:

- Article bodies are truncated before being sent to the LLM (`LLM_MAX_BODY_CHARS`).
- The response is limited using `MAX_OUTPUT_TOKENS`.
- Articles that are already enriched are skipped to avoid duplicate API calls.
- If `ANTHROPIC_API_KEY` is not configured, the application automatically falls back to a mock implementation so the project can run without incurring API costs.

---

## Measured API consumption

The integration was validated against the **real Anthropic API** using the supplied dataset.

| Metric               |            Value |
| -------------------- | ---------------: |
| Model                | Claude Haiku 4.5 |
| Articles processed   |               20 |
| Input tokens         |           11,938 |
| Output tokens        |            1,664 |
| Total tokens         |           13,602 |
| Total cost           |     ~$0.0203 USD |
| Average cost/article |     ~$0.0010 USD |

> The figures above were obtained from a real execution of the enrichment pipeline against Anthropic's API.

![alt text](docs/images/llm-usage.png)

---

## Estimated production cost

Assuming the supplied dataset is representative and the average token usage remains similar:

| Metric                           |    Estimate |
| -------------------------------- | ----------: |
| Articles/day                     |      50,000 |
| Input tokens/day                 |      ~29.8M |
| Output tokens/day                |       ~4.2M |
| Estimated daily cost             | ~$50.75 USD |
| Estimated monthly cost (30 days) | ~$1,522 USD |

Actual costs will vary depending on article length, prompt size and future Anthropic pricing.

---

# Security & Responsibility

## SQL Injection

All database access is performed using TypeORM parameterized queries.

User input is never concatenated into SQL statements.

---

## XSS

The supplied dataset intentionally contains HTML and JavaScript injection attempts.

The frontend never renders article content as HTML and relies on React's default escaping behaviour, preventing script execution.

---

## Prompt Injection

Article content must be considered untrusted input.

Several mitigations were implemented:

- Fixed system prompt
- Structured JSON output
- Input size limitation
- Separation between instructions and article content

These measures reduce the impact of malicious prompts embedded inside articles.

---

## Cost Controls

Several mechanisms prevent unnecessary LLM usage:

- Body truncation
- Maximum output tokens
- Duplicate enrichment detection
- Mock implementation when no API key is configured

These guardrails keep inference costs predictable while allowing the project to run locally without external API costs.

---

# Reflection

AI played a significant role throughout this assignment.

It was primarily used as an engineering assistant for discussing architecture, validating implementation ideas, exploring alternative approaches and accelerating repetitive coding tasks.

However, AI-generated code was never accepted blindly. Every important implementation was reviewed, adapted and tested before being integrated into the project.

The most valuable assistance came during:

- Exploring Boolean search alternatives
- Evaluating PostgreSQL Full Text Search
- Discussing LLM cost optimizations
- Reviewing architecture decisions

On several occasions AI suggested solutions that introduced unnecessary complexity. Those proposals were simplified to better match the scope of the assessment.

Given additional time, the following improvements would be considered:

- Background enrichment queue
- Result ranking improvements
- More comprehensive automated tests
- Containerized end-to-end environment

---

# Future Improvements

Possible future enhancements include:

- Background processing using queues.
- Redis caching for frequent searches.
- Improved search relevance ranking.
- Authentication and authorization.
- Asynchronous enrichment pipeline.
- Monitoring and observability dashboards.

---

# Additional Resources

The repository also includes supporting material used during development:

- `docs/images/` → Screenshots used throughout this README.
- `docs/postman/` → Postman collection and environment.
- `docs/ai-support/` → AI conversations used during the implementation, as requested in the assignment.

---

# License

This project was created exclusively as part of a technical assessment.
