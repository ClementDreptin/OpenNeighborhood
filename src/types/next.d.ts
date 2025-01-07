export type NextSearchParams = Record<string, string | string[] | undefined>;

export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<NextSearchParams>;
}

export interface LayoutProps {
  params: Promise<Record<string, string>>;
  children: React.ReactNode;
}
