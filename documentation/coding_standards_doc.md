# Save n Bite - Coding Standards (v3.0)  
**Team:** Secure Web & Mobile Guild (SWMG)  
**Date:** Aug 19, 2025  

## 1. Overview  
Defines conventions to ensure clarity, maintainability, and security.  
**Stack:** Django + DRF, PostgreSQL, Redis, Scikit-learn, Pandas | React + Vite, Tailwind | GitHub | Azure  

## 2. Core Principles  
- **Readability:** Self-documenting, consistent naming.  
- **DRY & SOLID:** Reuse, modular design.  
- **Error Handling:** Centralized logging + custom exceptions.  
- **Documentation:** Docstrings, API docs, migration notes, READMEs.  

## 3. Repository Structure  
```
save-n-bite/
├── backend/ (Django apps: auth, food_listings, analytics, etc.)
├── frontend/ (React src: components, hooks, services, utils)
├── documentation/
└── README.md
```
**Rules:** Apps = single domain, React by feature, tests mirror source, configs at root.  

## 4. Backend (Python/Django)  
- **Style:** PEP 8, Black (88 chars), isort, mypy.  
- **Naming:** snake_case (vars), PascalCase (classes), UPPER_SNAKE_CASE (constants).  
- **Models:** Use `db_table`, `ordering`, helper methods (`is_expired()`).  
- **Views/Serializers:** RESTful, permissions, validation in serializers.  
- **Error Handling:** Custom exceptions, logging best practices.  

## 5. Frontend (React/JS)  
- **Style:** ESLint + Prettier.  
- **Naming:** PascalCase (components), camelCase (utils/vars).  
- **Components:** Functional, prop-types, async handling with try/catch.  
- **Hooks:** Encapsulate fetch + state (`useFoodListings`).  
- **Styling:** Tailwind utility-first; avoid inline styles.  

## 6. Database (PostgreSQL)  
- **Tables/Columns:** lowercase_with_underscores.  
- **PK/FK:** `id`, `{table}_id`.  
- **Indexes & Constraints:** For performance/integrity.  
- **Migrations:** Always documented.  

## 7. API Standards  
- RESTful endpoints, plural nouns.  
- Proper HTTP methods + status codes.  
- JSON response format with `success`, `data`, `error`.  
- Pagination for lists.  

## 8. Testing  
- **Coverage:** 70%+ overall, 90% critical flows.  
- **Types:** Unit (utils), integration (API/db), E2E (key journeys).  
- **Frameworks:** Django Test Framework | Jest + RTL.  

## 9. Version Control  
- **Branches:** `main` (prod), `develop` (integration), `feature/*`, `bugfix/*`, `release/*`.  
- **Commits:** Conventional (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`).  
- **PRs:** Descriptive, reference issues, require review + passing tests.  

## 10. Environment & Config  
- `.env` for secrets (never committed).  
- Use `decouple` for Django settings.  
- Consistent config across dev/prod.  

## 11. Quality Tools  
- **Backend:** Black, isort, flake8, mypy.  
- **Frontend:** ESLint, Prettier, Jest, RTL.  

## 12. Security  
- **Auth:** JWT, RBAC, hashed passwords.  
- **Data:** Encryption, validation, SQL injection prevention, file restrictions.  
- **Privacy:** Minimal storage, retention policies, export/delete support.  
- **Environment:** HTTPS, HSTS, CSRF protection, strict CORS.  

## 13. Maintenance  
Follow standards, perform code reviews, run automated checks, and update guidelines as project evolves.  

**Maintainers:** Marco Geral, Sabrina-Gabriel Freeman  
**Last Updated:** Aug 19, 2025  
