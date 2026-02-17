import { useEffect, useState } from 'react';
import { Table, Card, Button, Tabs, Tag, message, Typography, Statistic, Row, Col } from 'antd';
import { DollarOutlined, CheckCircleOutlined, SyncOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text } = Typography;

const CodReconciliationPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING: Chờ thu, COLLECTED: Đã thu

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/tms/waybill');
      // Lọc các đơn ĐÃ GIAO THÀNH CÔNG (DELIVERED)
      const deliveredOrders = res.data.filter((x: any) => x.status === 'DELIVERED');
      setData(deliveredOrders);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // Lọc dữ liệu theo Tab
  const filteredData = data.filter(item => {
    const currentCodStatus = item.codStatus || 'PENDING'; // Mặc định là chưa thu
    return currentCodStatus === activeTab;
  });

  // Tính tổng tiền đang chọn
  const totalSelectedAmount = filteredData
    .filter(item => selectedRowKeys.includes(item.id))
    .reduce((sum, item) => sum + Number(item.codAmount || 0), 0);

  // Xử lý nút: XÁC NHẬN ĐÃ THU TIỀN
  const handleConfirmCollection = async () => {
    if (selectedRowKeys.length === 0) return message.warning('Chưa chọn đơn nào!');
    
    setLoading(true);
    try {
      // Lặp qua từng đơn để update (Thực tế nên có API bulk update)
      for (const id of selectedRowKeys) {
        await axios.patch(`http://localhost:3000/tms/waybill/${id}`, {
          codStatus: 'COLLECTED' // Chuyển sang đã thu
        });
      }
      message.success(`Đã thu hồi thành công ${totalSelectedAmount.toLocaleString()}đ vào két!`);
      setSelectedRowKeys([]);
      fetchData(); // Tải lại
    } catch (error) {
      message.error('Lỗi cập nhật');
    }
    setLoading(false);
  };

  const columns = [
    { title: 'Mã Vận Đơn', dataIndex: 'waybillCode', render: (t:string) => <b>{t}</b> },
    { 
      title: 'Người giữ tiền', dataIndex: 'driverName', 
      render: (t:string, r:any) => t ? <span><UserOutlined/> {t}</span> : <Tag color="blue">{r.providerId}</Tag> 
    },
    { 
      title: 'Số tiền COD', dataIndex: 'codAmount', align: 'right' as const,
      render: (val: number) => <Text strong style={{color: '#cf1322'}}>{Number(val).toLocaleString()} đ</Text>
    },
    { 
      title: 'Ngày giao', dataIndex: 'createdAt', // Tạm dùng createdAt, đúng ra là deliveredAt
      render: (val: string) => dayjs(val).format('DD/MM/YYYY') 
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
           <Card bordered={false}>
              <Statistic 
                title="Tiền mặt đang ở ngoài (Shipper giữ)" 
                value={data.filter(x => (x.codStatus||'PENDING') === 'PENDING').reduce((s,i)=>s+Number(i.codAmount||0),0)} 
                precision={0} 
                valueStyle={{ color: '#faad14' }} 
                prefix={<DollarOutlined />} 
                suffix="đ"
              />
           </Card>
        </Col>
        <Col span={12}>
           <Card bordered={false}>
              <Statistic 
                title="Đã thu về két (An toàn)" 
                value={data.filter(x => x.codStatus === 'COLLECTED').reduce((s,i)=>s+Number(i.codAmount||0),0)} 
                precision={0} 
                valueStyle={{ color: '#3f8600' }} 
                prefix={<CheckCircleOutlined />} 
                suffix="đ"
              />
           </Card>
        </Col>
      </Row>

      <Card 
        title="ĐỐI SOÁT & THU HỒI CÔNG NỢ COD" 
        extra={<Button icon={<SyncOutlined />} onClick={fetchData}>Làm mới</Button>}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => { setActiveTab(key); setSelectedRowKeys([]); }}
          items={[
            { key: 'PENDING', label: `Chờ thu hồi (${data.filter(x=>(x.codStatus||'PENDING')==='PENDING').length})` },
            { key: 'COLLECTED', label: 'Lịch sử đã thu' }
          ]}
        />
        
        {activeTab === 'PENDING' && (
           <div style={{ marginBottom: 16, padding: 10, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Đang chọn: <b>{selectedRowKeys.length}</b> đơn. Tổng tiền: <b style={{color:'red', fontSize:16}}>{totalSelectedAmount.toLocaleString()} đ</b></span>
              <Button type="primary" danger onClick={handleConfirmCollection} loading={loading} disabled={selectedRowKeys.length===0}>
                 Xác nhận Tiền đã về Két
              </Button>
           </div>
        )}

        <Table 
          rowSelection={activeTab === 'PENDING' ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys
          } : undefined}
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default CodReconciliationPage;