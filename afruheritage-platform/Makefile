.PHONY: up down logs bootstrap-admin lint

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f api worker

bootstrap-admin:
	curl -X POST http://localhost:8000/api/v1/auth/bootstrap \
	  -H 'Content-Type: application/json' \
	  -d '{"email":"admin@afruheritage.local","password":"ChangeMeNow!123","full_name":"Initial Admin"}'
