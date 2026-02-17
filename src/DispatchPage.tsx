import { useEffect, useState } from 'react';
import { Row, Col, Card, List, Button, Tag, Avatar, message, Modal, Select, Typography, Badge } from 'antd';
import { 
  CarOutlined, UserOutlined, RightOutlined, 
  EnvironmentOutlined, RocketOutlined, ShopOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const DispatchPage = () => {
  // State chứa danh sách
  const [pendingWaybills, setPendingWaybills] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // State xử lý chọn
  const [selectedWaybillIds, setSelectedWaybillIds] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Lấy đơn hàng đang chờ (Status = NEW hoặc READY_TO_PICK)
      // Thực tế sẽ gọi API: GET /tms/waybill?status=READY_TO_PICK
      const resWaybills = await axios.get('https://sh-wms-backend.onrender.com/tms/waybill');
      // Lọc tạm ở Client (sau này lọc ở Backend)
      const pending = resWaybills.data.filter((w: any) => w.status === 'NEW' || w.status === 'READY_TO_PICK');
      setPendingWaybills(pending);

      // 2. Lấy danh sách xe rảnh (Status = ACTIVE)
      const resVehicles = await axios.get('https://sh-wms-backend.onrender.com/vehicles');
      setVehicles(resVehicles.data.filter((v: any) => v.status === 'ACTIVE'));
    } catch (error) {
      console.error(error);
    }
  };

  // Xử lý chọn đơn hàng
  const toggleSelectWaybill = (id: string) => {
    if (selectedWaybillIds.includes(id)) {
      setSelectedWaybillIds(selectedWaybillIds.filter(i => i !== id));
    } else {
      setSelectedWaybillIds([...selectedWaybillIds, id]);
    }
  };

  // Xử lý Điều phối (Gán đơn cho xe)
  const handleDispatch = async () => {
    if (selectedWaybillIds.length === 0) return message.warning('Chưa chọn đơn hàng nào!');
    if (!selectedVehicle) return message.warning('Chưa chọn xe/tài xế!');

    setLoading(true);
    try {
      // Gọi API cập nhật cho từng đơn (Hoặc 1 API gộp nếu Backend hỗ trợ)
      // VD: PATCH /tms/waybill/dispatch { waybillIds: [...], vehicleId: ... }
      
      // Ở đây giả lập lặp qua từng đơn để update
      for (const id of selectedWaybillIds) {
        // Tìm thông tin xe
        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        await axios.patch(`https://sh-wms-backend.onrender.com/tms/waybill/${id}`, { // API này cần anh viết thêm bên Backend sau nhé
           status: 'DELIVERING', // Chuyển trạng thái sang Đang giao
           vehicleId: selectedVehicle,
           driverName: vehicle?.driverName,
           vehiclePlate: vehicle?.plateNumber
        });
      }

      message.success(`Đã điều phối ${selectedWaybillIds.length} đơn cho xe ${vehicles.find(v=>v.id===selectedVehicle)?.plateNumber}`);
      
      // Reset và tải lại
      setSelectedWaybillIds([]);
      setSelectedVehicle(null);
      fetchData();

    } catch (error) {
      message.error('Lỗi điều phối. (Kiểm tra xem Backend có API Patch chưa)');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 100px)' }}>
      <Row gutter={24} style={{ height: '100%' }}>
        
        {/* CỘT 1: DANH SÁCH ĐƠN CHỜ (PENDING) */}
        <Col span={10} style={{ height: '100%', overflow: 'auto' }}>
          <Card 
            title={<><ShopOutlined /> ĐƠN HÀNG CẦN GIAO <Badge count={pendingWaybills.length} style={{backgroundColor: '#1890ff'}} /></>} 
            bordered={false}
            bodyStyle={{ padding: 10 }}
          >
            <List
              dataSource={pendingWaybills}
              renderItem={item => (
                <Card 
                  size="small" 
                  hoverable 
                  style={{ 
                    marginBottom: 10, 
                    border: selectedWaybillIds.includes(item.id) ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    backgroundColor: selectedWaybillIds.includes(item.id) ? '#e6f7ff' : 'white'
                  }}
                  onClick={() => toggleSelectWaybill(item.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{item.waybillCode}</Text>
                    <Tag color="orange">{item.status}</Tag>
                  </div>
                  <div style={{ color: '#666', fontSize: 13, marginTop: 5 }}>
                    <EnvironmentOutlined /> {item.address || 'Địa chỉ...'}
                  </div>
                  <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{item.customerName}</Text>
                    <Text strong style={{ color: '#cf1322' }}>{parseInt(item.codAmount || 0).toLocaleString()} đ</Text>
                  </div>
                </Card>
              )}
            />
          </Card>
        </Col>

        {/* CỘT GIỮA: NÚT ĐIỀU PHỐI */}
        <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Button 
            type="primary" 
            shape="round" 
            icon={<RightOutlined />} 
            size="large"
            disabled={selectedWaybillIds.length === 0 || !selectedVehicle}
            loading={loading}
            onClick={handleDispatch}
            style={{ height: 60, width: 60 }}
          />
          <div style={{ marginTop: 10, textAlign: 'center', color: '#888' }}>
            Gán <b>{selectedWaybillIds.length}</b> đơn<br/>cho xe đã chọn
          </div>
        </Col>

        {/* CỘT 3: DANH SÁCH XE (AVAILABLE) */}
        <Col span={10} style={{ height: '100%', overflow: 'auto' }}>
          <Card title={<><CarOutlined /> ĐỘI XE SẴN SÀNG</>} bordered={false} bodyStyle={{ padding: 10 }}>
            <List
              dataSource={vehicles}
              renderItem={vehicle => (
                <Card 
                  size="small" 
                  hoverable 
                  style={{ 
                    marginBottom: 10,
                    border: selectedVehicle === vehicle.id ? '2px solid #52c41a' : '1px solid #f0f0f0',
                    backgroundColor: selectedVehicle === vehicle.id ? '#f6ffed' : 'white'
                  }}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      icon={vehicle.code?.includes('XE') ? <CarOutlined /> : <RocketOutlined />} 
                      style={{ backgroundColor: vehicle.code?.includes('XE') ? '#faad14' : '#722ed1', marginRight: 15 }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{vehicle.plateNumber}</Text>
                        <Tag color="success">Sẵn sàng</Tag>
                      </div>
                      <div style={{ color: '#888' }}>
                        <UserOutlined /> {vehicle.driverName}
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>
                        {vehicle.brand} - {vehicle.capacity}kg
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            />
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default DispatchPage;