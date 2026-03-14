import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ScrollContext = createContext({ isScrolled: false, scrollRef: { current: null } });

export const useScroll = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled(element.scrollTop > 10);
    };

    element.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check

    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ScrollContext.Provider value={{ isScrolled, scrollRef }}>
      {children}
    </ScrollContext.Provider>
  );
};