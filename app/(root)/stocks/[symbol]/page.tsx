import CompanyDetailLive from "@/components/CompanyDetailLive";

type StockDetailsPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;

  return <CompanyDetailLive symbol={symbol} />;
}
