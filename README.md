# De voz a letra ☀️

Webapp estática para transcribir archivos locales de audio o vídeo a texto. Usa Whisper Tiny mediante [Transformers.js](https://huggingface.co/docs/transformers.js/) y procesa todo directamente en el navegador: no hay servidor, cuentas, API keys ni variables de entorno.

Repositorio de destino: [analo33/devozaletra](https://github.com/analo33/devozaletra).

## Funciones

- Audio: MP3, WAV, M4A y OGG.
- Vídeo: MP4, WEBM y MOV (si el navegador soporta su códec de audio).
- Detección automática de español e inglés con Whisper.
- Modelo cuantizado, caché local y progreso de descarga/transcripción.
- Edición, copia y descarga del resultado en `.txt`.
- Dictado con Web Speech API como alternativa si Whisper no puede cargarse.
- Responsive, accesible y sin proceso de compilación.

> La primera transcripción descarga el modelo Whisper. Las siguientes reutilizan la caché del navegador. El rendimiento depende del equipo y de la duración del archivo.

## Probar en local

Puedes abrir `index.html` directamente. Para evitar restricciones que algunos navegadores aplican a archivos locales, se recomienda servir la carpeta:

```bash
python3 -m http.server 8000
```

Después abre `http://localhost:8000`.

## Publicar el código en GitHub

Si partes de esta carpeta local:

```bash
git init -b main
git add .
git commit -m "Crea la webapp De voz a letra"
git remote add origin https://github.com/analo33/devozaletra.git
git push -u origin main
```

Si el repositorio remoto ya contiene commits, clónalo primero y copia estos cuatro archivos en su raíz para conservar su historial.

## Desplegar en Vercel

1. Sube este proyecto a GitHub.
2. En [Vercel](https://vercel.com/new), selecciona **Add New → Project** e importa el repositorio.
3. En **Framework Preset**, elige **Other**.
4. Deja vacíos Build Command y Output Directory.
5. Pulsa **Deploy**.

`vercel.json` sirve `index.html` y mantiene la app como sitio estático.

## Desplegar en GitHub Pages

1. Abre el repositorio en GitHub.
2. Ve a **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama **main**, carpeta **/(root)**, y pulsa **Save**.

En unos minutos estará disponible en `https://analo33.github.io/devozaletra/`.

## Privacidad y compatibilidad

Los archivos no se suben a ningún servidor. El navegador descarga el modelo desde jsDelivr/Hugging Face y ejecuta la inferencia localmente con WebAssembly. Chrome y Edge recientes ofrecen la mejor compatibilidad. Safari y Firefox pueden variar según el códec del archivo y la memoria disponible.

Web Speech API no permite alimentar un archivo directamente: el fallback escucha el micrófono y usa el idioma principal del navegador (español o inglés).

## Estructura

```text
.
├── index.html
├── README.md
├── vercel.json
└── .gitignore
```

## Licencia

Uso libre para proyectos personales y educativos.
