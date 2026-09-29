# Anvee Interiors — Website

A responsive, animated website for **Anvee Interiors**, built with React, Vite, Framer Motion and Lenis smooth scrolling.

## Run it

```bash
npm install
npm run dev      # local development at http://localhost:5173
npm run build    # production build in /dist
npm run preview  # preview the production build
```

When you deploy, route every URL to `index.html` so that `/projects/...` links work on a page refresh. On Netlify, Vercel and Cloudflare Pages, turn on the "SPA" or "rewrite all to index.html" option.

## Adding your projects

All projects are stored in **`src/data/projects.js`**.

1. Create a folder for the project's photos, e.g. `public/projects/my-villa/`, and copy the images into it.
2. In `src/data/projects.js`, copy one of the existing project objects and edit its fields:

```js
{
  slug: 'my-villa',                 // used in the URL: /projects/residential/my-villa
  title: 'My Villa',
  category: 'residential',          // residential, commercial, hospitality or industrial
  location: 'Ahmedabad',
  year: '2025',
  area: '3,000 sq ft',
  type: 'Private Villa',
  cover: '/projects/my-villa/cover.jpg',
  description: 'A short paragraph about the project.',
  images: [
    '/projects/my-villa/01.jpg',                                            // plain path
    { src: '/projects/my-villa/02.jpg', caption: 'Living room', tag: 'Living' }, // with caption + filter tag
  ],
},
```

Each new project automatically:

- appears in its category listing and on the home page portfolio;
- gets its own animated photo library at `/projects/<category>/<slug>`, with a masonry grid, room filters (built from the `tag` values) and a full-screen viewer that supports swipe and keyboard navigation.

The portfolio contains 66 supplied images in 13 galleries across Residential, Commercial, Hospitality and Industrial. Krishnapark Waghodia is listed under Hospitality; Vriund's two properties share one gallery, matching the supplied folder.

Originals remain in `project photos/`. To regenerate the optimized JPEG copies and image dimensions after updating those originals, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prepare-project-photos.ps1
```

The script produces thumbnail, gallery and full-size copies (320, 1000 and up to 2000 pixels wide) in `public/projects/`, plus `src/data/project-images.json`. Add new source folders to the script's folder map, then add their captions and tags in `src/data/projects.js`. Dates, floor areas and locations are optional and only displayed when supplied.

## Studio details

Contact details, services, process steps, testimonials and stats are in **`src/data/site.js`**.

## Structure

```
src/
  data/        projects.js (portfolio) · site.js (studio content)
  components/  Navbar, Footer, Loader, Cursor, Lightbox, ParallaxImage, …
  sections/    Home page sections (Hero, Studio, Portfolio, Services, …)
  pages/       Home · Projects (category listing) · ProjectGallery (photo library)
  lib/         smooth scrolling, animation easings, helpers
```

Animations respect the visitor's *reduce motion* setting.
