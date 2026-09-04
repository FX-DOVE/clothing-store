import { useCallback, useEffect, useRef, useState } from 'react';

export default function ProductImageGallery({ images = [], alt = '', initialIndex = 0 }) {
  const [index, setIndex] = useState(initialIndex);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(initialIndex);
  const closeBtnRef = useRef(null);
  const previouslyFocused = useRef(null);
  const closingRef = useRef(false);

  const count = images.length || 0;
  const safeIndex = count ? Math.min(index, count - 1) : 0;
  const lbIndex = count ? Math.min(lightboxIndex, count - 1) : 0;

  const openLightbox = (i) => {
    closingRef.current = false;
    setLightboxIndex(i);
    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
  };

  const closeLightbox = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      closingRef.current = false;
      if (previouslyFocused.current) previouslyFocused.current.focus?.();
    }, 300);
  }, []);

  const go = useCallback(
    (dir) => {
      if (!count) return;
      setLightboxIndex((i) => {
        const next = i + dir;
        if (next < 0 || next >= count) return i;
        return next;
      });
    },
    [count]
  );

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, images]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }
    previouslyFocused.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);

    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Tab') {
        const root = document.getElementById('lightbox-root');
        if (!root) return;
        const focusable = root.querySelectorAll('button');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, closeLightbox, go]);

  if (!count) return null;

  const progressWidth = 100 / count;
  const progressLeft = progressWidth * lbIndex;

  return (
    <>
      <div className="pdp-gallery">
        <button
          type="button"
          className="pdp-main-image"
          onClick={() => openLightbox(safeIndex)}
          aria-label="Open image gallery"
        >
          <img src={images[safeIndex]} alt={alt} />
        </button>
        {count > 1 && (
          <div className="thumbs">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                className={`thumb ${i === safeIndex ? 'active' : ''}`}
                onClick={() => {
                  setIndex(i);
                  openLightbox(i);
                }}
                aria-label={`Image ${i + 1}`}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          id="lightbox-root"
          className={`lightbox-overlay ${visible ? 'lightbox-visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Product image gallery"
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {lbIndex > 0 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={() => go(-1)}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}
          {lbIndex < count - 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={() => go(1)}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                <path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}

          <div className="lightbox-stage">
            <img src={images[lbIndex]} alt={`${alt} ${lbIndex + 1}`} className="lightbox-image" />
          </div>

          {count > 1 && (
            <div className="lightbox-progress" aria-hidden="true">
              <div
                className="lightbox-progress-active"
                style={{ width: `${progressWidth}%`, left: `${progressLeft}%` }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
