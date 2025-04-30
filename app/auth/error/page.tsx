export default function ErrorPage({
    searchParams,
  }: {
    searchParams: { error?: string };
  }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-4">{searchParams.error || "Unknown error"}</p>
          <a href="/auth/login" className="text-blue-600 underline">
            Go back to login
          </a>
        </div>
      </div>
    );
  }
  