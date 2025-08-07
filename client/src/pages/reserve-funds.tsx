import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReserveFunds() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý quỹ dự trữ</h1>
        <p className="text-gray-600">Theo dõi và quản lý các quỹ dự trữ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quỹ dự trữ</CardTitle>
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
