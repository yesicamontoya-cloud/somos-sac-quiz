# Portal de Evaluaciones · Formación Inicial SAC · Somos Internet

Portal unificado de evaluaciones para el proceso de formación inicial de analistas SAC.

## Archivos

```
index.html                → Portal principal: todos los módulos, preguntas y panel de formadora
quiz-dias-1-2.html, quiz-dia-3.html, certificacion-sac.html, quiz-engine.js, quiz-styles.css
                          → Versión anterior por archivos (ya no se usa en el portal principal)
```

## Módulos y nota mínima

| Módulo | Preguntas | Tiempo | Nota mínima |
|---|---|---|---|
| Quiz Día 1–2 | 7 | 10 min | 85% para desbloquear el siguiente |
| Quiz Día 3 | 8 | 10 min | 85% para desbloquear el siguiente |
| Certificación SAC | 25 | 60 min | 85% |
| Certificación Retención | 20 | 45 min | 95% (se habilita al aprobar la Certificación SAC) |

La nota de cada módulo está en `MODULOS` (campo `umbral`) dentro de `index.html`.

## Editar preguntas sin tocar código

1. El Apps Script v5 (con guardado de preguntas) debe estar implementado y con la propiedad `CLAVE_FORMADORA` configurada. El código no se publica en este repositorio porque contiene el ID de la Sheet.
2. Entra al panel de formadora → **Editar preguntas** → cambia lo que necesites → **Guardar preguntas**.
3. Los cambios quedan en la pestaña **Preguntas** de la Sheet y todos los analistas los ven al volver a abrir el portal.
4. **Descargar respaldo** guarda una copia de todas las preguntas en tu computador.

## Cómo publicar en GitHub Pages

1. Crea un repositorio en GitHub (puede ser privado o público).
2. Sube todos los archivos de esta carpeta al repositorio.
3. Ve a **Settings → Pages**.
4. En "Source", selecciona **main** branch y carpeta **/ (root)**.
5. Guarda. En 1-2 minutos tendrás tu URL: `https://tu-usuario.github.io/nombre-repo/`

## Conectar con Google Sheets

El archivo `quiz-engine.js` tiene esta línea al inicio:

```javascript
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzYkqaUXtGZmoMfolW4QArIdzDwpmuO_ci5dxCSJ669KbL8fjCuXEIyRE5kqIgMiDFN/exec';
```

Ese es el URL del Google Apps Script actual de Somos. Si necesitas cambiarlo:
1. Abre `quiz-engine.js`
2. Reemplaza el valor de `SHEETS_URL` con el nuevo URL del script desplegado

## Actualizar preguntas

Cada quiz tiene sus preguntas en un array dentro del HTML:
- `quiz-dias-1-2.html` → busca `const PREGUNTAS_QUIZ12 = [`
- `quiz-dia-3.html` → busca `const PREGUNTAS_QUIZ3 = [`
- `certificacion-sac.html` → busca `const PREGUNTAS_CERT = [`

Cada pregunta tiene este formato:
```javascript
{
  nivel: 'facil' | 'medio' | 'dificil',
  texto: 'Texto de la pregunta',
  opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
  correcta: 0, // índice de la opción correcta (0=A, 1=B, 2=C, 3=D)
  explicacion: 'Explicación que se muestra al responder',
}
```

## Campos que llegan a Google Sheets

Por cada intento guardado:

| Campo | Descripción |
|-------|-------------|
| quizId | Identificador del quiz (quiz_dias_1_2, quiz_dia_3, certificacion_sac_dia4) |
| nombre | Nombre del analista |
| email | Correo @somosinternet.co |
| score | Número de respuestas correctas |
| total | Total de preguntas |
| pct | Porcentaje obtenido |
| aprobado | Aprobado / No aprobado / N/A (quizzes diagnóstico) |
| tiempoTotal | Tiempo total en segundos |
| cambiosPestana | Veces que cambió de pestaña |
| perdidasFoco | Veces que perdió el foco del navegador |
| preguntasFalladas | Lista de preguntas falladas con respuesta dada y correcta |
| fecha | Fecha y hora en formato Bogotá |

## Criterios de aprobación

- **Quiz Días 1-2**: Sin umbral (diagnóstico formativo)
- **Quiz Día 3**: Sin umbral (diagnóstico formativo)
- **Certificación SAC**: 85% mínimo (22/25 correctas)

## Fase 2 (próximamente)

- Certificación Soporte N1
- Certificación TV
