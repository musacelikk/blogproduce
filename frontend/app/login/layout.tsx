/**
 * Navbar ve Footer, globals.css içindeki `body:has([data-login-page])`
 * kuralı ile gizlenir — ekstra DOM manipülasyonu gerekmez.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-login-page className="min-h-screen bg-background">
      {children}
    </div>
  );
}
