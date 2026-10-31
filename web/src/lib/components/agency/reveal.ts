export interface RevealOptions {
  delay?: number;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    node.classList.add('is-revealed');
    return {};
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.classList.add('is-revealed');
    return {};
  }

  const instance = node as HTMLElement & { __revealDelay?: number };
  if (options.delay) instance.__revealDelay = options.delay;
  if (!node.hasAttribute('data-reveal')) node.setAttribute('data-reveal', '');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement & { __revealDelay?: number };
        if (target.__revealDelay) target.style.transitionDelay = `${target.__revealDelay}ms`;
        target.classList.add('is-revealed');
        observer.unobserve(target);
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  observer.observe(node);
  return {
    destroy() {
      observer.disconnect();
    }
  };
}
