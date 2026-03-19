.PHONY: up down logs migrate create-migration bootstrap-admin lint

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f api worker

## Run all pending Alembic migrations (applies to the running postgres container)
migrate:
	docker compose exec api alembic upgrade head

## Create a new Alembic migration revision.
## Usage: make create-migration MSG="describe your change"
create-migration:
	docker compose exec api alembic revision --autogenerate -m "$(MSG)"

## Bootstrap the first superuser (only works when ENABLE_BOOTSTRAP_ADMIN=true)
bootstrap-admin:
	curl -sS -X POST http://localhost:8000/api/v1/auth/bootstrap \
	  -H 'Content-Type: application/json' \
	  -d '{"email":"admin@afruheritage.local","password":"ChangeMeNow!123","full_name":"Initial Admin"}' \
	  | python3 -m json.tool
