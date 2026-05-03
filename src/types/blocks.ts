// ============================================
// Tipos dos blocos de conteúdo
// ============================================

export type BlockType =
  | 'DESCRIPTION'
  | 'FEATURES'
  | 'IMAGES'
  | 'BADGES'
  | 'TABLE'
  | 'INFO_BOX'
  | 'SEO_TEXT'
  | 'VIDEO'
  | 'FAQ'
  | 'CUSTOM_HTML';

export type BlockEffect = 'NONE' | 'ACCORDION' | 'COLLAPSE' | 'TABS';

// --- Conteúdos específicos por tipo ---

export interface DescriptionContent {
  html: string; // rich text / HTML sanitizado
}

export interface Feature {
  icon?: string;   // nome do ícone (ex: "check", "star", "shield")
  text: string;
}
export interface FeaturesContent {
  items: Feature[];
  columns?: 1 | 2 | 3;
}

export interface ImageItem {
  url?: string;
  desktopUrl?: string;
  mobileUrl?: string;
  alt?: string;
  caption?: string;
}
export interface ImagesContent {
  items: ImageItem[];
  layout?: 'grid' | 'carousel' | 'tabs';
}

export interface Badge {
  label: string;
  icon?: string;
  color?: string;  // hex ou nome
  imageUrl?: string;
  imageDesktopUrl?: string;
  imageMobileUrl?: string;
}
export interface BadgesContent {
  items: Badge[];
  layout?: 'row' | 'grid';
}

export interface TableRow {
  label: string;
  value: string;
}
export interface TableContent {
  headers?: string[];
  rows: TableRow[] | string[][];
  striped?: boolean;
}

export interface InfoBoxContent {
  text: string;
  style?: 'info' | 'success' | 'warning' | 'tip';
  icon?: string;
}

export interface SeoTextContent {
  text: string;
  displayMode?: 'hidden' | 'collapsed'; // 'hidden' = apenas DOM, 'collapsed' = ver mais
}

export interface VideoContent {
  url: string;     // YouTube ou Vimeo URL
  title?: string;
  thumbnail?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
export interface FaqContent {
  items: FaqItem[];
}

export interface CustomHtmlContent {
  html: string;
}

export type BlockContent =
  | DescriptionContent
  | FeaturesContent
  | ImagesContent
  | BadgesContent
  | TableContent
  | InfoBoxContent
  | SeoTextContent
  | VideoContent
  | FaqContent
  | CustomHtmlContent;

// --- Bloco completo ---

export interface Block {
  id: number;
  productConfigId: number;
  type: BlockType;
  title?: string;
  content: BlockContent;
  order: number;
  effect: BlockEffect;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Linha da planilha de importação ---

export interface ImportRow {
  rowNumber: number;
  productId: number | string;
  blockType: string;
  title?: string;
  content: string;  // JSON string ou texto simples
  order?: number;
  effect?: string;
}

export interface ImportRowError {
  row: number;
  productId: string | number;
  message: string;
}
