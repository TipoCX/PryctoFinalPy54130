# Gensen 🚀

**Gensen** es un proyecto Full-Stack desarrollado por Felipe Roman. Concebido originalmente como un ejercicio académico para el curso de Python en Coderhouse, este sistema ha sido escalado y refactorizado para servir como **Proyecto Destacado de Portfolio**. 

Demuestra la integración de conceptos y arquitecturas avanzadas de nivel *Enterprise* utilizando un Backend rígido en Python y un Frontend dinámico en React.

---

## 💎 Características Principales (Portfolio Highlights)

1. **Frictionless Onboarding (Cuentas Autogeneradas):**
   - Sistema de retención de usuarios pensado para reclutadores. Si un visitante intenta publicar en el muro o dar *Like* sin estar registrado, el backend forja transparentemente en milisegundos una "Cuenta de Invitado" con JWT e inicio de sesión automático. Nadie abandona la app por la barrera del registro.

2. **Arquitectura de Mensajería Escaneable (Threads):**
   - El viejo modelo de "Emisor a Receptor" fue destruido en favor de una tabla `Conversation` polinómica (ManyToMany). Gensen soporta lógicamente "Chats de Grupos", e indexaciones puras (`db_index=True`) para ordenar mensajes en tiempo récord O(log N).

3. **Optimización N+1 Aniquilada:**
   - Para evitar que la API ahogue la Base de Datos con 100 consultas al montar el feed, implementamos las complejas sub-queries analíticas de Django (`.annotate()` y `.select_related()`), comprimiendo la carga matemática a 1 sola invocación.

4. **Motor de Paginación Oscura (Infinite Scroll):**
   - Adiós a los botones rígidos de "Siguiente". Mediante observadores geométricos del DOM, React se da cuenta de cuándo te acercas a menos de 150 píxeles del final de tu pantalla e inyecta asíncronamente el siguiente bloque paginado de recursos proveniente de Django.

---

## 🛠️ Stack Tecnológico

- **Backend Logic**: Django 5.x, Django REST Framework, SimpleJWT.
- **Base de Datos**: SQLite nativo (Totalmente agnóstico y portado por el ORM a PostgreSQL/MySQL mediante sus modelos).
- **Frontend SPA**: React, TypeScript, Vite.
- **Diseño**: CSS modular nativo, variables de entorno para Dark Mode absoluto atado al `localStorage`, Iconografía Lucide.

---

## 🚦 Guía de Inicio Rápido (Local)

El proyecto viene preparado con un *batch script* (`start.bat`) que levanta paralelamente tanto al servidor API de Django como el compilador en frío de Vite.

1. Asegúrate de tener Python y Node.js instalados.
2. Clona el repositorio e instala las dependencias de ambas carpetas.
3. Haz doble clic en `start.bat` o ejecútalo en la terminal.
4. Tu navegador te estará esperando en `http://localhost:5173/`.
