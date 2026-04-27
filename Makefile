SHELL := /bin/bash

.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend lint lint-backend lint-frontend build build-frontend check-backend

help:
	@echo "Archivist developer commands"
	@echo "  make install           Install backend and frontend dependencies"
	@echo "  make dev-backend       Run FastAPI backend with auto-reload"
	@echo "  make dev-frontend      Run Vite frontend dev server"
	@echo "  make dev               Show instructions for running both services"
	@echo "  make lint              Run all lint checks"
	@echo "  make build             Build frontend assets"
	@echo "  make check-backend     Compile backend Python sources"

install: install-backend install-frontend

install-backend:
	cd archivist-backend && poetry install

install-frontend:
	cd archivist-frontend && npm install

dev:
	@echo "Run these in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend:
	cd archivist-backend && poetry run uvicorn app.main:app --reload

dev-frontend:
	cd archivist-frontend && npm run dev

lint: lint-frontend check-backend

lint-frontend:
	cd archivist-frontend && npm run lint

check-backend:
	cd archivist-backend && poetry run python -m compileall app

build: build-frontend

build-frontend:
	cd archivist-frontend && npm run build
