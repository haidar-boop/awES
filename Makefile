.PHONY: install backend frontend dev build test run clean

# Install everything (Python venv + node modules).
install:
	python3 -m venv .venv
	. .venv/bin/activate && pip install -r backend/requirements.txt
	cd frontend && npm install

# Run the engine unit tests.
test:
	. .venv/bin/activate && cd backend && PYTHONPATH=. python -m pytest tests/ -q

# Dev: backend on :8000 (run this and `make frontend` in two terminals).
backend:
	. .venv/bin/activate && cd backend && PYTHONPATH=. uvicorn main:app --reload --port 8000

# Dev: Vite dev server on :5173 (proxies /api -> :8000).
frontend:
	cd frontend && npm run dev

# Production build of the frontend (served by FastAPI).
build:
	cd frontend && npm run build

# Single-service production run (build first, then serve everything on :8000).
run: build
	. .venv/bin/activate && cd backend && PYTHONPATH=. uvicorn main:app --host 0.0.0.0 --port 8000

clean:
	rm -rf .venv frontend/node_modules frontend/dist
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
