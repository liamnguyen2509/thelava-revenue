import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockIn() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nhập kho</h1>
        <p className="text-gray-600">Quản lý việc nhập hàng vào kho</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhập kho</CardTitle>
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
