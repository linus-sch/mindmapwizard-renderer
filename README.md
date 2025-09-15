# Mind Map Wizard — Renderer

Lightweight JavaScript that renders Markdown as SVG mind maps. This project is provided by Mind Map Wizard for developers to inspect how the rendering engine works.

<br>

- Demo: https://js.mindmapwizard.com

<br>


## What this is
This repository contains a small, self-contained HTML/CSS/JS renderer that converts Markdown into SVG mind maps. It is intended as a developer-facing demo and learning resource. does not power Mind Map Wizard's webapp.

<br>


## Features
- Parses simple Markdown headings and lists into a hierarchical mind map
- Optimized for light and darkmode use
- Renders to SVG for crisp visuals and easy styling
- Minimal, dependency-free code

<br>


## Notable inspiration
This project is heavily inspired by markmap (https://github.com/markmap/markmap). See that project for a more feature-rich implementation and more functionality.

<br>


## Usage

1. Clone the repo:
```bash
git clone https://github.com/linus-sch/mindmapwizard-renderer.git
```

2. Open the demo HTML in a browser:
```bash
open demo/index.html
```

3. Edit the sample Markdown in demo/index.html (or load your own Markdown) to see live rendering to SVG.

<br>


## File structure
- src/renderer.js — core JS that converts Markdown to SVG  
- demo/index.html — simple page demonstrating the renderer  
- demo/styles.css — minimal styling for demo and SVG  

<br>

## Attribution
If you share demos, screenshots, or examples publicly, include this credit where reasonable:

"Mind Map Wizard Renderer by Linus-sch"
<br>

## Contributing
This repo is intended as a demo/reference. Contributions are welcome as output improvements or bug reports. Do not submit changes that attempt to remove or weaken the license restrictions.

<br>

## Contact
For permission to use this code beyond the license terms or for commercial inquiries, contact: linus@example.com
