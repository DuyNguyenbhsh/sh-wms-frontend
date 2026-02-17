import { useEffect, useState } from 'react';
import { 
  Table, Card, Tag, Button, Space, Typography, Tooltip, 
  message, Input, Select, Row, Col, Modal, Descriptions, Divider 
} from 'antd';
import { 
  PrinterOutlined, CarOutlined, CheckCircleOutlined, 
  SyncOutlined, FileSearchOutlined, SearchOutlined, 
  RocketOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

const WaybillListPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State cho bộ lọc
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // State cho Modal chi tiết / In ấn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWaybill, setCurrentWaybill] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [waybillsRes, providersRes] = await Promise.all([
        axios.get('https://sh-wms-backend.onrender.com/tms/waybill'),
        axios.get('https://sh-wms-backend.onrender.com/master-data/providers')
      ]);
      setData(waybillsRes.data);
      setProviders(providersRes.data);
    } catch (error) {
      message.error('Lỗi tải dữ liệu');
    }
    setLoading(false);
  };

  const getProviderName = (id: string) => {
    const p = providers.find(x => x.id === id);
    return p ? <Tag color="blue">{p.name}</Tag> : <Tag>Nội bộ / Khác</Tag>;
  };

  // Hàm hiển thị trạng thái đẹp mắt
  const renderStatus = (status: string) => {
    switch (status) {
      case 'NEW': return <Tag icon={<ClockCircleOutlined />} color="default">Mới tạo</Tag>;
      case 'READY_TO_PICK': return <Tag icon={<CheckCircleOutlined />} color="orange">Chờ lấy hàng</Tag>;
      case 'DELIVERING': return <Tag icon={<RocketOutlined />} color="processing">Đang giao hàng</Tag>;
      case 'DELIVERED': return <Tag icon={<CheckCircleOutlined />} color="success">Đã giao xong</Tag>;
      case 'CANCELLED': return <Tag color="error">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  // Xử lý In Vận Đơn
  const handlePrint = (record: any) => {
    setCurrentWaybill(record);
    setIsModalOpen(true);
    // Trong thực tế, anh có thể mở một cửa sổ mới window.open('/print-waybill/...') để in PDF
  };

  // Lọc dữ liệu
  const filteredData = data.filter(item => {
    const matchText = item.waybillCode?.toLowerCase().includes(searchText.toLowerCase()) || 
                      item.customerName?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchText && matchStatus;
  });

  const columns = [
    {
      title: 'Mã Vận Đơn', dataIndex: 'waybillCode', key: 'waybillCode', width: 180,
      render: (t: string) => <Text strong copyable>{t}</Text>
    },
    {
      title: 'Đơn vị vận chuyển', dataIndex: 'providerId', key: 'providerId',
      render: (id: string) => getProviderName(id)
    },
    {
      title: 'Thông tin giao hàng', key: 'info',
      render: (_: any, r: any) => (
        <div>
           <div><Text strong>{r.customerName}</Text> - <Text type="secondary">{r.phone}</Text></div>
           <div style={{fontSize: 12, color: '#666'}}>{r.address}</div>
        </div>
      )
    },
    {
      title: 'Thu hộ (COD)', dataIndex: 'codAmount', align: 'right' as const, width: 120,
      render: (val: string) => <Text strong style={{color: '#faad14'}}>{parseInt(val || '0').toLocaleString()} đ</Text>
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', width: 140,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Trạng thái', dataIndex: 'status', align: 'center' as const, width: 150,
      render: (status: string) => renderStatus(status)
    },
    {
      title: 'Thao tác', key: 'action', align: 'center' as const, width: 100,
      render: (_:any, record: any) => (
        <Space>
          <Tooltip title="In Phiếu Giao Hàng">
             <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card 
        title={<span><CarOutlined /> DANH SÁCH VẬN ĐƠN (Chờ xuất kho)</span>} 
        bordered={false} 
        style={{ borderRadius: 8 }}
      >
        {/* THANH CÔNG CỤ TÌM KIẾM */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
           <Col span={8}>
              <Input 
                prefix={<SearchOutlined style={{color: '#ccc'}} />} 
                placeholder="Tìm mã vận đơn, tên khách hàng..." 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
           </Col>
           <Col span={4}>
              <Select defaultValue="ALL" style={{ width: '100%' }} onChange={setStatusFilter}>
                 <Option value="ALL">Tất cả trạng thái</Option>
                 <Option value="READY_TO_PICK">Chờ lấy hàng</Option>
                 <Option value="DELIVERING">Đang giao hàng</Option>
                 <Option value="DELIVERED">Đã giao xong</Option>
              </Select>
           </Col>
           <Col span={12} style={{ textAlign: 'right' }}>
              <Button onClick={fetchData} icon={<SyncOutlined />}>Làm mới</Button>
           </Col>
        </Row>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      </Card>

      {/* MODAL IN PHIẾU GIAO HÀNG (Giả lập) */}
      <Modal 
         title={<><PrinterOutlined /> Phiếu Giao Hàng</>}
         open={isModalOpen} 
         onCancel={() => setIsModalOpen(false)}
         width={700}
         footer={[
            <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>In Ngay</Button>
         ]}
      >
         {currentWaybill && (
            <div id="print-area" style={{ padding: 20, border: '1px dashed #ccc', background: '#fff' }}>
               <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Title level={4}>PHIẾU GIAO HÀNG</Title>
                  <Text type="secondary">Mã vận đơn: {currentWaybill.waybillCode}</Text>
               </div>
               <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Người nhận">{currentWaybill.customerName} - {currentWaybill.phone}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ giao">{currentWaybill.address}</Descriptions.Item>
                  <Descriptions.Item label="Tiền thu hộ (COD)"><Text strong style={{fontSize: 16}}>{parseInt(currentWaybill.codAmount).toLocaleString()} VNĐ</Text></Descriptions.Item>
                  <Descriptions.Item label="Đơn vị vận chuyển">{getProviderName(currentWaybill.providerId)}</Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">Cho xem hàng trước khi nhận</Descriptions.Item>
               </Descriptions>
               
               <Divider />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                  <div style={{textAlign: 'center', width: '40%'}}>
                     <Text strong>Người nhận hàng</Text><br/>
                     <Text type="secondary">(Ký, ghi rõ họ tên)</Text>
                  </div>
                  <div style={{textAlign: 'center', width: '40%'}}>
                     <Text strong>Nhân viên giao hàng</Text><br/>
                     <Text type="secondary">(Ký xác nhận)</Text>
                  </div>
               </div>
            </div>
         )}
      </Modal>
    </div>
  );
};

export default WaybillListPage;