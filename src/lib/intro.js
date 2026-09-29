import { createContext, useContext } from 'react';

/** `true` once the opening loader has lifted, so hero animations can start. */
export const IntroContext = createContext(true);
export const useIntroDone = () => useContext(IntroContext);
