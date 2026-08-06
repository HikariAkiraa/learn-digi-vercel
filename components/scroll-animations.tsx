'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  direction?: 'bottom' | 'left' | 'right' | 'fade';
  delay?: number;
  className?: string;
  requireScroll?: boolean;
}

export function FadeInSection({
  children,
  direction = 'bottom',
  delay = 0,
  className = '',
  requireScroll = false,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let hasScrolled = window.scrollY > 10;
    let intersecting = false;

    const checkVisibility = () => {
      if (intersecting && (!requireScroll || hasScrolled)) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        if (checkVisibility() && ref.current) {
          observer.unobserve(ref.current);
        }
      },
      { threshold: 0.12 }
    );

    const onScroll = () => {
      if (window.scrollY > 10) {
        hasScrolled = true;
        if (checkVisibility()) {
          if (ref.current) observer.unobserve(ref.current);
          window.removeEventListener('scroll', onScroll);
        }
      }
    };

    if (requireScroll) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (ref.current) observer.observe(ref.current);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [requireScroll]);

  const getInitialClass = () => {
    switch (direction) {
      case 'left':
        return '-translate-x-16 opacity-0';
      case 'right':
        return 'translate-x-16 opacity-0';
      case 'bottom':
        return 'translate-y-12 opacity-0';
      case 'fade':
      default:
        return 'opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? 'translate-x-0 translate-y-0 opacity-100' : getInitialClass()
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatProps {
  targetValue: number;
  label: string;
  delay?: number;
}

export function StatShuffleCounter({ targetValue, label, delay = 0 }: StatProps) {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let userScrolled = window.scrollY > 5;

    const checkScrollAndIntersect = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView && userScrolled) {
        setHasStarted(true);
        window.removeEventListener('scroll', onScroll);
      }
    };

    const onScroll = () => {
      if (window.scrollY > 5) {
        userScrolled = true;
        checkScrollAndIntersect();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    checkScrollAndIntersect();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const startTimeout = setTimeout(() => {
      const duration = 1000; // 1 second random number shuffle
      const intervalTime = 40;
      const startTime = Date.now();

      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;

        if (elapsedTime >= duration) {
          clearInterval(timer);
          setDisplayValue(String(targetValue));
        } else {
          // Generate fast changing random numbers
          const randomVal = Math.floor(Math.random() * 90) + 10;
          setDisplayValue(String(randomVal));
        }
      }, intervalTime);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [hasStarted, targetValue, delay]);

  return (
    <div
      ref={ref}
      className="bg-fd-background px-4 py-5"
    >
      <dt className="font-display text-2xl font-semibold text-fd-foreground">
        {hasStarted ? displayValue : ''}
      </dt>
      <dd className="mt-0.5 text-xs text-fd-muted-foreground">{label}</dd>
    </div>
  );
}
