import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan kho hàng</h1>
        <p className="text-gray-600">Theo dõi tình trạng kho hàng tổng thể</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan kho</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Tính năng đang được phát triển...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
