import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { Providers } from "@/providers";

export default function App() {
  return (
    <Providers>
      <AppShellLayout />
    </Providers>
  );
}
