import { useEffect } from 'react';
import { useSiteConfig } from '../config/SiteConfigContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export function SEOHead({ title, description, ogImage, canonical, noIndex }: SEOHeadProps) {
  const { config } = useSiteConfig();

  useEffect(() => {
    if (!config) return;

    // Title
    const pageTitle = title
      ? config.seo.titleTemplate.replace('%s', title)
      : config.seo.defaultTitle;
    document.title = pageTitle;

    // Meta description
    const desc = description || config.seo.description;
    setMeta('description', desc);
    setMeta('og:description', desc);
    setMeta('twitter:description', desc);

    // OG
    setMeta('og:title', pageTitle);
    setMeta('og:type', 'website');
    setMeta('twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', pageTitle);

    if (ogImage || config.seo.ogImage) {
      setMeta('og:image', ogImage || config.seo.ogImage);
      setMeta('twitter:image', ogImage || config.seo.ogImage);
    }

    // Canonical
    if (canonical || config.site.url) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical || `${config.site.url}${window.location.pathname}`;
    }

    // noIndex
    if (noIndex) {
      setMeta('robots', 'noindex, nofollow');
    }
  }, [config, title, description, ogImage, canonical, noIndex]);

  return null;
}

function setMeta(name: string, content: string) {
  const isOg = name.startsWith('og:') || name.startsWith('twitter:');
  const attr = isOg ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
