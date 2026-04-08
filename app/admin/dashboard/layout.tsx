"use client";

import DashboardNavigation from "@/components/admin/dashboard/DashboardNavigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNavigation />
      <div className="flex pt-16 overflow-hidden bg-background lg:pt-0">
        <div
          id="main-content"
          className="relative w-full min-h-screen overflow-x-hidden overflow-y-hidden bg-background border-l-0 border-border lg:border-l lg:ml-56"
        >
          <main>
            <div className="p-5 sm:p-8 2xl:px-10 2xl:py-9">
              <div className="w-full min-h-[calc(100vh-230px)]">
                <div className="bg-background">
                  {children}
                </div>
              </div>
            </div>
          </main>

          <p className="my-10 text-sm font-thin text-center text-white opacity-30">
            Desarrollado por tosunian.dev
          </p>
        </div>
      </div>
    </>
  );
}
