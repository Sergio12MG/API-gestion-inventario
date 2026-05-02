$ErrorActionPreference = 'Stop'

Write-Host "=== Estado de contenedores ===" -ForegroundColor Cyan
docker compose ps

Write-Host "`n=== Logs recientes: usuarios_db (últimas 40 líneas) ===" -ForegroundColor Cyan
docker compose logs usuarios_db --tail 40

Write-Host "`n=== Logs recientes: inventario_pedidos_db (últimas 40 líneas) ===" -ForegroundColor Cyan
docker compose logs inventario_pedidos_db --tail 40

Write-Host "`n=== Tablas en usuarios_db (5432 / usuario postgres) ===" -ForegroundColor Green
docker exec usuarios_db_container psql -U postgres -d usuarios_db -c "\dt"

Write-Host "`n=== Tablas en inventario_pedidos_db (5433 / usuario sergi) ===" -ForegroundColor Green
docker exec inventario_db_container psql -U sergi -d inventario_pedidos_db -c "\dt"

Write-Host "`nDiagnóstico completado." -ForegroundColor Yellow
