# Gensen 🚀

**Gensen** es un proyecto Full-Stack desarrollado por Felipe Roman. Concebido originalmente como un ejercicio académico para el curso de Python en Coderhouse, este sistema ha sido escalado y refactorizado para servir como **Proyecto Destacado de Portfolio**. 

Demuestra la integración de conceptos y arquitecturas avanzadas de nivel *Enterprise* utilizando un Backend rígido en Python y un Frontend dinámico en React.

---

## 💎 Características Principales (Portfolio Highlights)

1. **Frictionless Onboarding (Cuentas Autogeneradas):**
   - Sistema de retención de usuarios pensado para reclutadores. Si un visitante intenta publicar en el muro o dar *Like* sin estar registrado, el backend forja transparentemente en milisegundos una "Cuenta de Invitado" con JWT e inicio de sesión automático. Nadie abandona la app por la barrera del registro.

3. **Motor de Paginación Oscura (Infinite Scroll):**
   - Adiós a los botones rígidos de "Siguiente". Mediante observadores geométricos del DOM, React se da cuenta de cuándo te acercas a menos de 150 píxeles del final de tu pantalla e inyecta asíncronamente el siguiente bloque paginado de recursos proveniente de Django.

---

## 🛠️ Stack Tecnológico

- **Backend Logic**: Django 5.x, Django REST Framework, SimpleJWT.
- **Base de Datos**: SQLite nativo (Totalmente agnóstico y portado por el ORM a PostgreSQL/MySQL mediante sus modelos).
- **Frontend SPA**: React, TypeScript, Vite.
- **Diseño**: CSS modular nativo, variables de entorno para Dark Mode absoluto atado al `localStorage`, Iconografía Lucide.
