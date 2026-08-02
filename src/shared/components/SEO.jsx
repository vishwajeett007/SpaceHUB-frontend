import { useEffect } from 'react';

/**
 * SEO component to dynamically manage document head, title, meta tags,
 * Open Graph, Twitter Cards, Canonical links, and JSON-LD structured data.
 */
export const SEO = ({
  title,
  description = 'Spacehub - A unified workspace for teams to chat, share, and build together.',
  keywords = 'Spacehub, team collaboration, real-time chat, workspace, messaging, group chat, team communication',
  image = '/favicon.png',
  url,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) => {
  useEffect(() => {
    const siteUrl = 'https://www.spacehubx.me';
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const fullTitle = title ? `${title} | Spacehub` : 'Spacehub - Unified Team Workspace & Collaboration Platform';
    const fullImgUrl = image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : siteUrl}${image}`;

    // 1. Update document title
    document.title = fullTitle;

    // Helper to create or update meta tags
    const setMetaTag = (selector, attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to create or update link tags
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    setMetaTag('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('meta[name="author"]', 'name', 'author', 'Spacehub Team');

    // 3. Open Graph Tags
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Spacehub');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    if (image) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', fullImgUrl);
    }

    // 4. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    if (image) {
      setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', fullImgUrl);
    }


    // 5. Canonical Link
    setLinkTag('canonical', currentUrl);

    // 6. JSON-LD Structured Data
    let scriptElement = document.getElementById('json-ld-schema');
    if (jsonLd) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = 'json-ld-schema';
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(jsonLd);
    } else if (scriptElement) {
      scriptElement.remove();
    }
  }, [title, description, keywords, image, url, type, noindex, jsonLd]);

  return null;
};

export default SEO;
