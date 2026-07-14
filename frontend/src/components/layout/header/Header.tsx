// components/layout/Header.tsx
// Sticky wrapper around the main navigation.
import Navigation from "./Navigation";
// import StatusBar from "./StatusBar";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50">
      {/* <StatusBar/> */}
      <Navigation />
    </header>
  );
};

export default Header;
