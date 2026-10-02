const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// High resolution SVG definition matching the exact uploaded inatec_tecnologico_nacional.png
const svgContent = `<svg width="1000" height="520" viewBox="0 0 1000 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&amp;family=Courier+Prime:wght@700&amp;family=Montserrat:wght@900&amp;display=swap');
      
      .inatec-title {
        font-family: 'Alfa Slab One', 'Rockwell', 'Impact', 'Arial Black', sans-serif;
        font-size: 195px;
        font-weight: 900;
        fill: #00AEEF;
        letter-spacing: 6px;
      }
      
      .tecnologico-subtitle {
        font-family: 'Courier Prime', 'Courier New', 'American Typewriter', 'Rockwell', monospace;
        font-size: 64px;
        font-weight: 700;
        fill: #EC008C;
        letter-spacing: 4px;
      }
    </style>
  </defs>

  <!-- 1. INATEC Title in Cyan without white stroke -->
  <text x="500" y="175" text-anchor="middle" class="inatec-title">INATEC</text>

  <!-- 2. Tecnológico Nacional Subtitle in Magenta without white stroke -->
  <text x="500" y="285" text-anchor="middle" class="tecnologico-subtitle">Tecnológico Nacional</text>

  <!-- 3. Three Sector Badges (Solid circles without white outer border) -->
  <g transform="translate(210, 350)">
    
    <!-- Circle 1: Blue - Industria y Construcción (Compás de Diseño Técnico) -->
    <g transform="translate(85, 80)">
      <circle cx="0" cy="0" r="78" fill="#0D5B94" />
      
      <!-- Precision Compass Icon in White -->
      <!-- Top pivot ring -->
      <circle cx="0" cy="-38" r="10" fill="none" stroke="#FFFFFF" stroke-width="7" />
      <circle cx="0" cy="-38" r="4.5" fill="#FFFFFF" />
      
      <!-- Compass Legs -->
      <path d="M -8 -30 L -34 42" stroke="#FFFFFF" stroke-width="8.5" stroke-linecap="round" />
      <path d="M 8 -30 L 34 42" stroke="#FFFFFF" stroke-width="8.5" stroke-linecap="round" />
      
      <!-- Horizontal crossbar and adjustment dial -->
      <path d="M -38 10 L 38 10" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" />
      <circle cx="0" cy="10" r="6" fill="#FFFFFF" />
    </g>

    <!-- Circle 2: Magenta - Comercio y Servicio (Maletín) -->
    <g transform="translate(290, 80)">
      <circle cx="0" cy="0" r="78" fill="#D80075" />
      
      <!-- Briefcase Icon in White -->
      <!-- Handle -->
      <path d="M -16 -18 C -16 -32, 16 -32, 16 -18" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" />
      <!-- Briefcase Body -->
      <rect x="-38" y="-18" width="76" height="52" rx="9" fill="#FFFFFF" />
      <!-- Middle divider line & lock -->
      <path d="M -38 6 L 38 6" stroke="#D80075" stroke-width="4.5" />
      <circle cx="0" cy="6" r="6.5" fill="#D80075" />
      <circle cx="0" cy="6" r="3" fill="#FFFFFF" />
    </g>

    <!-- Circle 3: Green - Agropecuario y Forestal (Campo y Cultivos) -->
    <g transform="translate(495, 80)">
      <circle cx="0" cy="0" r="78" fill="#85C441" />
      
      <clipPath id="field-circle-clip">
        <circle cx="0" cy="0" r="78" />
      </clipPath>
      
      <g clip-path="url(#field-circle-clip)">
        <!-- Sun -->
        <circle cx="-36" cy="-30" r="15" fill="#FFFFFF" />
        
        <!-- Cypress/Poplar Trees -->
        <path d="M 16 -36 C 7 -36, 1 -20, 5 -1 C 11 2, 18 2, 24 -1 C 29 -20, 23 -36, 16 -36 Z" fill="#FFFFFF" />
        <path d="M 38 -28 C 32 -28, 26 -16, 29 2 C 34 5, 41 5, 45 2 C 50 -16, 44 -28, 38 -28 Z" fill="#FFFFFF" />
        
        <!-- Crop Furrow Curves -->
        <path d="M -78 10 C -30 8, 20 8, 78 5 L 78 14 C 20 17, -30 17, -78 19 Z" fill="#FFFFFF" />
        <path d="M -78 28 C -30 25, 20 22, 78 18 L 78 29 C 20 34, -30 38, -78 41 Z" fill="#FFFFFF" />
        <path d="M -78 47 C -30 44, 18 41, 78 37 L 78 50 C 18 57, -30 61, -78 66 Z" fill="#FFFFFF" />
      </g>
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write the clean SVG to public/inatec_tecnologico_nacional.svg
  const svgPath = path.join(publicDir, 'inatec_tecnologico_nacional.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Saved SVG to:', svgPath);

  // 2. Render to PNG using resvg at 1000x520
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: 1000,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const pngPath = path.join(publicDir, 'inatec_tecnologico_nacional.png');
  fs.writeFileSync(pngPath, pngBuffer);
  console.log('Saved PNG to:', pngPath, 'Size:', pngBuffer.length, 'bytes');
}

main().catch(console.error);
