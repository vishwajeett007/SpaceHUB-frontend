import { Component } from 'react';

class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <section className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-3 text-gray-600">
            The page could not be displayed. Reload to start from a clean state.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Reload page
          </button>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
