import { Outlet } from "react-router-dom";

import AuthHeader from "@/components/layout/header/AuthHeader";

const AuthLayout = () => {
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <AuthHeader />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
