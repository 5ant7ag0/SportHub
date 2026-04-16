# Proyecto SportHub - Reglas y Directrices

## Stack Tecnológico
- Backend: Django
- Base de Datos: MongoDB (NoSQL)

## Objetivo del Proyecto
Crear una red social para deportistas que incluya un módulo de analítica basado en Estadística Descriptiva (medias, porcentajes, tendencias).

## Regla de Optimización de Base de Datos
**CRÍTICO**: Todas las consultas a la base de datos de MongoDB deben estar optimizadas para extraer y calcular métricas estadísticas descriptivas de manera eficiente. Esto implica:
1. Usar adecuadamente las *aggregation pipelines* de MongoDB.
2. Indexar de forma óptima los campos utilizados para filtrar o calcular promedios, tendencias o frecuencias.
3. Evitar el procesamiento pesado de datos a nivel de aplicación (Django) cuando se pueda resolver más eficientemente a nivel de base de datos (MongoDB).
4. Estructurar los documentos (esquema) pensando en la escalabilidad y las lecturas analíticas.
