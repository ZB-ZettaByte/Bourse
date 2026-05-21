import MarketFooter from "@/components/MarketFooter";
import {headers} from "next/headers";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname");

    if (pathname === "/" || !pathname) {
        return children;
    }

    return (
        <main className="min-h-screen bg-[#f7f7f7] text-black">
            {children}
            <MarketFooter />
        </main>
    )
}
export default Layout
