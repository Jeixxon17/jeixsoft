export interface SiteSettings {
  whatsapp: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  email?: string;
}

export interface Project {
  id?: string;
  title: string;
  client?: string;
  summary: string;
  stack: string[];
  year?: string;
  url?: string;
  repo?: string;
  imageUrl?: string;
  imagePath?: string;
  published: boolean;
  order: number;
}
