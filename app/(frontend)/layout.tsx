import type { ReactNode } from "react";

const FrontendLayout = ({ children }: { children: ReactNode }) => (
  <html lang="es">
    <body>{children}</body>
  </html>
);

export default FrontendLayout;
