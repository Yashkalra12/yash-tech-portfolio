import { useEffect, useRef, useState } from 'react';

const UseIntersectionObserver = (targetRef, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const handleIntersection = (entries) => {
      const entry = entries[0];
      setIsIntersecting(entry.isIntersecting);
    };

    // Clean up the previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new observer and observe the target element
    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(target);

    return () => {
      // Clean up on component unmount or when the target/options change
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetRef, options]);

  return isIntersecting;
};

export default UseIntersectionObserver;
