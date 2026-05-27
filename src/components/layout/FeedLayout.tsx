import AppSidebar from "./AppSidebar";

interface Props {
  children: React.ReactNode;
}

export default function FeedLayout({ children }: Props) {
  return (
    <>
      <AppSidebar />
      <div className="md:pl-[200px] min-h-dvh bg-secondary/30">
        <div className="md:mx-auto md:max-w-[420px] md:h-dvh md:bg-background md:shadow-lg md:border-x md:border-border">
          {children}
        </div>
      </div>
    </>
  );
}
