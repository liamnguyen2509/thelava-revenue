import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-600">Cấu hình các tham số hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Đơn vị tiền tệ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Tính năng đang được phát triển...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tài khoản phân bổ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Tính năng đang được phát triển...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh mục chi phí</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Tính năng đang được phát triển...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cổ đông và tỷ lệ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Tính năng đang được phát triển...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
