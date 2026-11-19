# Старый Мельник — interactive 3D bottle

A static, single-page site showing a 3D beer bottle with live liquid: it sloshes when the
bottle moves, foams when shaken, and carbonation bubbles rise through it.

## Run

Open `index.html` in a browser. It is one self-contained file (styles, scripts, three.js and
fonts are inlined), so it works on its own wherever it is copied or previewed.

## Edit

`index.html` is generated — edit the sources, then rebuild:

```sh
node build.js
```

- `index.src.html`, `css/style.css` — page and styling
- `js/main.js` — WebGL scene: glass, cap, liquid shader, bubbles, scroll staging, interaction
- `js/labels.js` — label artwork painted to canvas and used as textures
- `vendor/three.min.js` — three.js r187 bundled as a single classic script (MIT)
- `fonts/` — Ruslan Display and Playfair Display (SIL Open Font License)
