const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center flex-col gap-4">
    <h1 className="text-4xl font-bold">403 - Unauthorized</h1>
    <p>You do not have permission to view this page.</p>
    <a href="/" className="text-blue-600 underline">
      Return Home
    </a>
  </div>
);
export default Unauthorized;
