import React, { createContext, useContext, useState } from 'react';

const ScrollContext = createContext({ isScrolled: false, setScrolled: () => {} });

export const useScroll = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  const setScrolled = (value) => {
    setIsScrolled(value);
  };

  return (
    <ScrollContext.Provider value={{ isScrolled, setScrolled }}>
      {children}
    </ScrollContext.Provider>
  );
};