# Atalhos de desenvolvimento para Gestao Integrada.
# Windows usa GNU Make com PowerShell; macOS/Linux usa shell POSIX.

.DEFAULT_GOAL := help

ifeq ($(OS),Windows_NT)
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
NPM := npm.cmd
else
SHELL := /bin/sh
NPM := npm
endif

.PHONY: help install setup dev open status logs stop reset start test lint typecheck check build db-up db-down db-status db-logs clean

ifeq ($(OS),Windows_NT)
help:
	@('Gestao Integrada - comandos de desenvolvimento', '', 'PRIMEIRA EXECUCAO', '  make install    Instala as dependencias do projeto', '  make setup      Instala dependencias e inicia o PostgreSQL', '  make help       Exibe este guia', '', 'INICIAR O AMBIENTE', '  make dev        Inicia PostgreSQL e app em desenvolvimento', '  make open       Inicia o ambiente e abre o navegador', '  make status     Exibe o status do app e do PostgreSQL', '', 'ACOMPANHAR O AMBIENTE', '  App local:      http://localhost:3000', '  make logs       Acompanha os logs dos servicos Docker', '  make db-logs    Acompanha os logs do PostgreSQL', '  make db-status  Exibe o estado do PostgreSQL', '', 'VALIDAR ANTES DE ENTREGAR', '  make typecheck  Verifica erros TypeScript', '  make test       Executa os testes', '  make check      Executa typecheck e testes', '  make build      Gera o build de producao', '', 'ENCERRAR O AMBIENTE', '  make stop       Encerra o app local e executa docker compose down', '  make db-down    Para somente o PostgreSQL', '', 'MANUTENCAO', '  make clean      Remove artefatos locais de build', '  make reset      Recria dependencias e o container, sem apagar dados', '  make start      Gera o build e inicia em producao') | ForEach-Object { Write-Host $$_ }
else
help:
	@printf '%s\n' \
	'Gestao Integrada - comandos de desenvolvimento' \
	'' \
	'PRIMEIRA EXECUCAO' \
	'  make install    Instala as dependencias do projeto' \
	'  make setup      Instala dependencias e inicia o PostgreSQL' \
	'  make help       Exibe este guia' \
	'' \
	'INICIAR O AMBIENTE' \
	'  make dev        Inicia PostgreSQL e app em desenvolvimento' \
	'  make open       Inicia o ambiente e abre o navegador' \
	'  make status     Exibe o status do app e do PostgreSQL' \
	'' \
	'ACOMPANHAR O AMBIENTE' \
	'  App local:      http://localhost:3000' \
	'  make logs       Acompanha os logs dos servicos Docker' \
	'  make db-logs    Acompanha os logs do PostgreSQL' \
	'  make db-status  Exibe o estado do PostgreSQL' \
	'' \
	'VALIDAR ANTES DE ENTREGAR' \
	'  make typecheck  Verifica erros TypeScript' \
	'  make test       Executa os testes' \
	'  make check      Executa typecheck e testes' \
	'  make build      Gera o build de producao' \
	'' \
	'ENCERRAR O AMBIENTE' \
	'  make stop       Encerra o app local e executa docker compose down' \
	'  make db-down    Para somente o PostgreSQL' \
	'' \
	'MANUTENCAO' \
	'  make clean      Remove artefatos locais de build' \
	'  make reset      Recria dependencias e o container, sem apagar dados' \
	'  make start      Gera o build e inicia em producao'
endif

install:
	$(NPM) ci

setup: install db-up

ifeq ($(OS),Windows_NT)
dev:
	@& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\\scripts\\check-dev-port.ps1'; $$portCheckExitCode = $$LASTEXITCODE; if ($$portCheckExitCode -eq 2) { exit 0 }; if ($$portCheckExitCode -ne 0) { exit $$portCheckExitCode }; & '$(MAKE)' db-up; if ($$LASTEXITCODE -ne 0) { exit $$LASTEXITCODE }; & '$(NPM)' run dev

open:
	@& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\\scripts\\open-project.ps1' -OpenBrowser; exit $$LASTEXITCODE

status:
	@& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\\scripts\\project-status.ps1'; exit $$LASTEXITCODE

logs:
	docker compose logs -f

stop:
	@& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\\scripts\\stop-project.ps1'; exit $$LASTEXITCODE

reset: clean db-down setup
else
dev: db-up
	$(NPM) run dev

open: dev

status: db-status

logs:
	docker compose logs -f

stop:
	docker compose down

reset: clean db-down setup
endif

start: build db-up
	$(NPM) run start

test:
	$(NPM) test

typecheck:
	$(NPM) run lint

lint: typecheck

check: typecheck test

build:
	$(NPM) run build

db-up:
	docker compose up -d --wait postgres

db-down:
	docker compose stop postgres

db-status:
	docker compose ps postgres

db-logs: logs

ifeq ($(OS),Windows_NT)
clean:
	Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue; Remove-Item -Force server.js -ErrorAction SilentlyContinue
else
clean:
	rm -rf dist server.js
endif
