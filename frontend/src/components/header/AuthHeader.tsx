// src/components/header/AuthHeader.tsx

import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

const AuthHeader = () => {
  return (
    <header className="h-16 bg-background">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center px-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>
    </header>
  );
};

export default AuthHeader;
