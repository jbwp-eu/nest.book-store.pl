import { Outlet } from "react-router-dom";
import AuthSessionSync from "@/components/auth/AuthSessionSync";
import Container from "@/components/layout/Container";
import DemoNoticeBar from "@/components/layout/DemoNoticeBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <AuthSessionSync />
      <Header />
      <DemoNoticeBar />
      <main className="flex-1 py-8">
        <Container>
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;
