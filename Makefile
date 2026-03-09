.PHONY: dev-backend dev-frontend docker-up docker-down lint-backend lint-frontend

dev-backend:
	cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

lint-backend:
	ruff check backend/  # requires: pip install ruff

lint-frontend:
	cd frontend && npm run lint
