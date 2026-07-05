// components/layout/Header.tsx
// Sticky wrapper around the main navigation.

import Navigation from "./Navigation";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50">
      <Navigation />
    </header>
  );
};

export default Header;
