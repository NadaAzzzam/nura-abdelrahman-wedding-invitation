import type { Metadata } from "next";
import type { ReactNode } from "react";
import { basePath } from "../site";

export const metadata: Metadata = {
  title: "رسائل الضيوف",
  description: "صفحة خاصة لعرض رسائل الضيوف.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
  },
  alternates: {
    canonical: `${basePath}/messages`,
  },
};

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return children;
}
