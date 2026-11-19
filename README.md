# Старый Мельник — interactive 3D bottle

A static, single-page site showing a 3D beer bottle with live liquid: it sloshes when the
bottle moves, foams when shaken, and carbonation bubbles rise through it.

## Run

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Layout

- `index.html`, `css/style.css` — page and styling
- `js/main.js` — WebGL scene: glass, cap, liquid shader, bubbles, scroll staging, interaction
- `js/labels.js` — label artwork painted to canvas and used as textures
- `vendor/three.min.js` — three.js r187 bundled as a single classic script (MIT)
- `fonts/` — Ruslan Display and Playfair Display (SIL Open Font License)
