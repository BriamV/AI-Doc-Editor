
# T-04-ST5: Ingest Benchmark Procedure

This guide explains how to execute the Locust benchmark that validates **PERF-003** (ingesta <= 120 s para 10 MB) for task T-04.

## Prerequisitos

- Backend en ejecución (`yarn all:dev` o `yarn be:dev`).
- Usuario válido y token JWT obtenido mediante el flujo OAuth.
- Dependencias de backend instaladas (`yarn be:install`).

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `BENCHMARK_AUTH_TOKEN` | Token JWT (`Bearer`) reutilizado en los requests. **Obligatorio.** | — |
| `BENCHMARK_FILE_SIZE_MB` | Tamaño del archivo sintético que se sube en cada iteración. | `10` |
| `BENCHMARK_WAIT_TIME_MIN` | Espera mínima entre iteraciones (segundos). | `0.2` |
| `BENCHMARK_WAIT_TIME_MAX` | Espera máxima entre iteraciones (segundos). | `1.0` |
| `BENCHMARK_DELETE_AFTER_UPLOAD` | Cuando es `true`, elimina el documento (`hard_delete=true`) tras cada subida para evitar que el disco crezca sin control. | `true` |
| `BENCHMARK_REPORT_PATH` | Ruta del reporte JSON generado. | `backend/reports/ingest_benchmark_report.json` |

## Ejecución

```bash
yarn be:install  # asegura locust y dependencias
yarn be:performance:ingest -- --users 5 --spawn-rate 1 --run-time 3m   --host http://localhost:8000
```

> Usa `LOCUST_OPTS` o argumentos adicionales después de `--` para personalizar usuarios, ramp-up, etc.

## Salida

- Consola: resumen con throughput (MB/h) y tiempos promedio/p95.
- Reporte JSON en `backend/reports/ingest_benchmark_report.json` con métricas y configuración utilizada. Este reporte sirve como evidencia para PERF-003.

## Notas

- El archivo en memoria es Markdown sintético y cumple las validaciones de tipo y tamaño (`UploadService`).
- Si el benchmark se ejecuta contra un entorno remoto, ajusta `--host` y las esperas (`BENCHMARK_WAIT_TIME_MIN/MAX`).
- El script elimina los documentos si `BENCHMARK_DELETE_AFTER_UPLOAD=true`, pero en entornos compartidos considera desactivar esta opción.
