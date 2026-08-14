import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function GlobalMotion() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const scope = document.querySelector<HTMLElement>('[data-motion-scope]');
    if (!scope || reduceMotion) return;

    const sections = Array.from(scope.querySelectorAll<HTMLElement>('main section, [data-reveal]'));
    sections.forEach((section, index) => {
      section.classList.add('motion-reveal');
      section.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 45}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('motion-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
    sections.forEach((section) => observer.observe(section));

    if (coarsePointer) return () => observer.disconnect();

    const focusSections = Array.from(scope.querySelectorAll<HTMLElement>('[data-cursor-focus]'));
    let frame = 0;
    const move = (event: PointerEvent) => {
      const section = (event.target as Element | null)?.closest<HTMLElement>('[data-cursor-focus]');
      if (!section) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        section.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
        section.dataset.pointerActive = 'true';
      });
    };
    const leave = (event: PointerEvent) => {
      const section = event.currentTarget as HTMLElement;
      delete section.dataset.pointerActive;
    };
    scope.addEventListener('pointermove', move, { passive: true });
    focusSections.forEach((section) => section.addEventListener('pointerleave', leave));

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      scope.removeEventListener('pointermove', move);
      focusSections.forEach((section) => section.removeEventListener('pointerleave', leave));
    };
  }, [pathname]);

  return null;
}
