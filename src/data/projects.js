import imageDetails from './project-images.json';

/*
 * Project library: originals are in project photos/. Generate web copies with
 * scripts/prepare-project-photos.ps1. Each image tuple is [file ID, caption, tag].
 * Add year, area and location only when known; omitted metadata stays hidden.
 */
const photo = (slug, id) => `/projects/${slug}/img_${id}.jpg`;
const gallery = (slug, shots) => shots.map(([id, caption, tag]) => {
  const src = photo(slug, id);
  return { src, caption, tag, ...imageDetails[src] };
});

export const categories = {
  residential: {
    key: 'residential', title: 'Residential',
    tagline: 'Homes composed around the way you live',
    cover: photo('hiya-horizon', 1469),
  },
  commercial: {
    key: 'commercial', title: 'Commercial',
    tagline: 'Workspaces shaped around people and purpose',
    cover: photo('janmahal-sayajigunj-office', 2114),
  },
  hospitality: {
    key: 'hospitality', title: 'Hospitality',
    tagline: 'Welcoming spaces made for gathering',
    cover: photo('krishnapark-waghodia', 2169),
  },
  industrial: {
    key: 'industrial', title: 'Industrial',
    tagline: 'Functional spaces with a considered finish',
    cover: photo('jayant-packing', 2199),
  },
};

export const projects = [
  {
    slug: 'hiya-horizon', title: 'Hiya Horizon', category: 'residential',
    type: 'Home Interiors', cover: photo('hiya-horizon', 1469),
    description: 'Soft curves, pale finishes and warm wood bring the living spaces together. A fluted television wall, a compact kitchen and individually detailed bedrooms carry the same calm palette through the home.',
    images: gallery('hiya-horizon', [
      [1469, 'Living room with curved seating and pendant lights', 'Living'],
      [1456, 'Fluted television wall and floating console', 'Living'],
      [2220, 'Kitchen with patterned backsplash', 'Kitchen'],
      [2221, 'Bedroom with wood-framed wall panels', 'Bedroom'],
      [2227, 'Bedroom with sculpted headboard wall', 'Bedroom'],
    ]),
  },
  {
    slug: 'vriund-residences', title: 'Vriund Residences', category: 'residential',
    type: 'Two Residential Properties', cover: photo('vriund-residences', 1661),
    description: 'A collection of interiors across two Vriund properties. Sculptural seating, layered lighting and tailored storage connect the living spaces, while each kitchen and bedroom has its own material palette and character.',
    images: gallery('vriund-residences', [
      [1661, 'Living room with curved sofas and an arched feature wall', 'Living'],
      [1671, 'Lounge with media wall and accent chairs', 'Living'],
      [1666, 'Kitchen with burgundy cabinetry', 'Kitchen'],
      [1667, 'Breakfast counter and display cabinet', 'Dining'],
      [1682, 'Kitchen and dining in warm neutral tones', 'Kitchen'],
      [1684, 'Dining corner with a statement pendant', 'Dining'],
      [1747, 'Bedroom with muted green accents', 'Bedroom'],
      [1759, 'Bedroom with illuminated headboard panels', 'Bedroom'],
      [1844, 'Wardrobe shelving and dressing table', 'Details'],
      [1859, 'Bedroom with decorative wall panels', 'Bedroom'],
      [1868, 'Bedroom with upholstered headboard and wall lighting', 'Bedroom'],
      [1878, 'Bedroom with a geometric feature wall', 'Bedroom'],
    ]),
  },
  {
    slug: 'auro-vivanta', title: 'Auro Vivanta', category: 'residential',
    type: 'Home Interiors', cover: photo('auro-vivanta', 2218),
    description: 'A gentle palette of cream, grey and blue runs through the living room and bedrooms. Rounded furniture, arched cabinetry and finely detailed wall panels give everyday spaces a quiet sense of character.',
    images: gallery('auro-vivanta', [
      [2218, 'Living and dining with rounded seating', 'Living'],
      [2217, 'Media unit with arched display shelves', 'Living'],
      [2212, 'Bedroom with an illuminated mirror', 'Bedroom'],
      [2214, 'Bedroom with blue patterned panels and a study nook', 'Bedroom'],
      [2219, 'Bedroom with arched wardrobe fronts', 'Bedroom'],
    ]),
  },
  {
    slug: 'samriddhi-60-onyx', title: 'Samriddhi 60 Onyx', category: 'residential',
    type: 'Home Interiors', cover: photo('samriddhi-60-onyx', 2225),
    description: 'Panelled walls, soft upholstery and warm lighting define this home. The living room pairs deep-toned seating with pale finishes, while the bedrooms explore patterned headboards and carefully framed lighting.',
    images: gallery('samriddhi-60-onyx', [
      [2225, 'Living room with deep green seating', 'Living'],
      [2226, 'Television wall with warm accent lighting', 'Living'],
      [1446, 'Bedroom with an illuminated arched headboard', 'Bedroom'],
      [1449, 'Bedroom with geometric wall detailing', 'Bedroom'],
      [1474, 'Entry console and wall hooks', 'Details'],
    ]),
  },
  {
    slug: 'aaranya-99', title: 'Aaranya 99', category: 'residential',
    type: 'Home Interiors', cover: photo('aaranya-99', 2200),
    description: 'Warm neutrals, reflective surfaces and framed wall details connect the lounge and kitchen. A breakfast counter creates a compact gathering spot, while sculpted bedroom panels introduce a softer, more intimate mood.',
    images: gallery('aaranya-99', [
      [2200, 'Living room reflected in the mirrored partition', 'Living'],
      [2201, 'Kitchen and breakfast counter', 'Kitchen'],
      [2203, 'Bedroom with sculptural wall relief', 'Bedroom'],
    ]),
  },
  {
    slug: 'ankleshwar', title: 'Ankleshwar Residence', category: 'residential',
    location: 'Ankleshwar', type: 'Home Interiors', cover: photo('ankleshwar', 2209),
    description: 'A green-accented living room anchors a series of individually styled bedrooms. Wood finishes, textured headboards and restrained lighting bring warmth to the simple, practical layouts.',
    images: gallery('ankleshwar', [
      [2209, 'Living room with green seating and layered lighting', 'Living'],
      [2205, 'Bedroom with grey cabinetry and wood flooring', 'Bedroom'],
      [2206, 'Bedroom with a padded headboard', 'Bedroom'],
      [2207, 'Bedroom with fluted and wood wall panels', 'Bedroom'],
      [2210, 'Bedroom with a terracotta feature wall', 'Bedroom'],
      [2211, 'Bedroom with a blue tiled feature wall', 'Bedroom'],
    ]),
  },
  {
    slug: 'janmahal-sayajigunj-office', title: 'Janmahal Sayajigunj Office', category: 'commercial',
    location: 'Sayajigunj', type: 'Office & Learning Spaces', cover: photo('janmahal-sayajigunj-office', 2114),
    description: 'A softly lit reception leads into glazed workspaces and classrooms. Timber ceilings, vertical screens and travel-inspired wall graphics create a consistent identity across the office.',
    images: gallery('janmahal-sayajigunj-office', [
      [2114, 'Reception with timber ceiling and illuminated desk', 'Reception'],
      [2120, 'Workstations behind a vertical screen', 'Workspace'],
      [2138, 'Screen detailing beside the reception', 'Workspace'],
      [2116, 'Corridor with travel-inspired wall graphics', 'Details'],
      [2130, 'Classroom with integrated display', 'Classroom'],
      [2141, 'Classroom seating and teaching wall', 'Classroom'],
    ]),
  },
  {
    slug: 'manjalpur-office', title: 'Manjalpur Office', category: 'commercial',
    location: 'Manjalpur', type: 'Office & Learning Spaces', cover: photo('manjalpur-office', 2069),
    description: 'Pale finishes and blue-green accents connect the reception, open workstations and teaching spaces. Curved ceiling lighting and glazed partitions keep the interiors bright and visually connected.',
    images: gallery('manjalpur-office', [
      [2069, 'Reception with fluted blue-grey desk', 'Reception'],
      [2064, 'Open office with glazed meeting rooms', 'Workspace'],
      [2063, 'Shared workstations beside the windows', 'Workspace'],
      [2044, 'Classroom with blue-green acoustic panels', 'Classroom'],
      [2048, 'Classroom viewed from the teaching area', 'Classroom'],
      [2052, 'Classroom seating beneath curved lighting', 'Classroom'],
    ]),
  },
  {
    slug: 'racecourse-office', title: 'Racecourse Office', category: 'commercial',
    location: 'Racecourse', type: 'Office Interiors', cover: photo('racecourse-office', 2005),
    description: 'A shared meeting space, open workstations and a compact reception form this office. Geometric wall panels, timber accents and a light palette bring the different working areas together.',
    images: gallery('racecourse-office', [
      [2005, 'Meeting room with geometric wall panels', 'Meeting'],
      [2035, 'Open-plan workstations', 'Workspace'],
      [2038, 'Reception and glazed entrance', 'Reception'],
    ]),
  },
  {
    slug: 'ahmedabad-office', title: 'Ahmedabad Office', category: 'commercial',
    location: 'Ahmedabad', type: 'Office Interiors', cover: photo('ahmedabad-office', 2182),
    description: 'A fluted reception desk and timber ceiling welcome visitors into a bright office. Glazed partitions, shared workstations and destination-themed graphics shape the spaces beyond.',
    images: gallery('ahmedabad-office', [
      [2182, 'Reception with fluted desk and timber ceiling', 'Reception'],
      [2186, 'Shared workspace with glazed partitions', 'Workspace'],
      [2189, 'Window-side workstations', 'Workspace'],
      [2190, 'Workspace with a Canada-themed feature wall', 'Workspace'],
    ]),
  },
  {
    slug: 'studio', title: 'Studio', category: 'commercial',
    type: 'Recording Studio', cover: photo('studio', 2097),
    description: 'Soft seating, textured wall panels and warm overhead lighting create an intimate studio setting. The arrangement accommodates both conversation and recording within a compact, carefully detailed space.',
    images: gallery('studio', [
      [2097, 'Studio seating with sofa and armchairs', 'Lounge'],
      [2094, 'Conversation setting with two armchairs', 'Lounge'],
      [2095, 'Textured wall panels and warm lighting', 'Details'],
      [2098, 'Recording setup with studio lighting', 'Recording'],
    ]),
  },
  {
    slug: 'krishnapark-waghodia', title: 'Krishnapark Waghodia', category: 'hospitality',
    location: 'Waghodia', type: 'Restaurant Interiors', cover: photo('krishnapark-waghodia', 2169),
    description: 'Turquoise seating, woven pendant lights and warm timber give this dining space its identity. Long banquettes and generous windows create a bright, welcoming setting around the tables.',
    images: gallery('krishnapark-waghodia', [
      [2169, 'Dining room with turquoise seating and woven pendants', 'Dining'],
      [2171, 'Window-side dining and banquette seating', 'Dining'],
    ]),
  },
  {
    slug: 'jayant-packing', title: 'Jayant Packing', category: 'industrial',
    type: 'Industrial Office', cover: photo('jayant-packing', 2199),
    description: 'A workplace concept for Jayant Packing, bringing together reception, meeting rooms and focused workstations. Glass partitions, pale surfaces and timber accents balance a practical layout with a welcoming arrival.',
    images: gallery('jayant-packing', [
      [2199, 'Reception with timber feature wall', 'Reception'],
      [2193, 'Meeting room with suspended linear lighting', 'Meeting'],
      [2194, 'Conference table and glazed partitions', 'Meeting'],
      [2195, 'Individual workstations with upholstered dividers', 'Workspace'],
      [2196, 'Glazed corridor alongside the meeting room', 'Workspace'],
    ]),
  },
];

export const normalizeImage = (img) => (typeof img === 'string' ? { src: img } : img);

/** Small copies for grids and thumbnails; full size for the viewer. */
export const sized = (src, width) => {
  if (imageDetails[src]) {
    const suffix = width <= 320 ? '-320' : width <= 1200 ? '-1000' : '';
    return src.replace(/\.jpg$/, `${suffix}.jpg`);
  }
  return src?.includes('images.unsplash.com') ? `${src}&w=${width}` : src;
};

export const getProjectsByCategory = (category) => projects.filter((p) => p.category === category);
export const getProject = (category, slug) => projects.find((p) => p.category === category && p.slug === slug);
export const getNextProject = (project) => {
  const list = getProjectsByCategory(project.category);
  if (list.length === 1) return projects[(projects.indexOf(project) + 1) % projects.length];
  return list[(list.findIndex((p) => p.slug === project.slug) + 1) % list.length];
};
