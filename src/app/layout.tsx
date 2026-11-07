import type { Metadata } from "next";
import { Provider } from "@/components/store";
import { Header, Footer } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "Companion · 让陪伴自然发生",
  description:
    "领养一只属于你的金毛。聊聊天，歇一会儿，把平凡日子过得温暖一点。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Provider>
          <Header />
          {children}
          <Footer />
        </Provider>
      </body>
    </html>
  );
}
