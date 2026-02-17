import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Input, Space, List, Typography, Divider } from 'antd';
import { PrinterOutlined, PlusOutlined, SearchOutlined, CarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text } = Typography;

const WaybillListPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchData();
    // Lắng nghe sự kiện xoay màn hình/đổi kích thước
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await axios.get(`${apiUrl}/tms/waybill`);
      setData(res.data.reverse()); // Mới nhất lên đầu
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  // CỘT CHO MÁY TÍNH
  const columns = [
    { title: 'Mã Vận Đơn', dataIndex: 'waybillCode', render: (t:string) => <b>{t}</b> },
    { title: 'ĐVVC', dataIndex: 'providerId', render: (t:string) => <Tag color="blue">{t}</Tag> },
    { title: 'Thu hộ (COD)', dataIndex: 'codAmount', render: (v:any) => <b style={{color:'red'}}>{Number(v).toLocaleString()}đ</b> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: (v:string) => dayjs(v).format('DD/MM HH:mm') },
    { title: 'Trạng thái', dataIndex: 'status', render: (s:string) => <Tag color={s==='DELIVERED'?'green':'orange'}>{s}</Tag> },
    { title: 'Thao tác', render: () => <Button icon={<PrinterOutlined />} size="small" /> }
  ];

  return (
    <div style={{ padding: isMobile ? 10 : 20 }}>
      {/* THANH CÔNG CỤ */}
      <div style={{ marginBottom: 15, display: 'flex', gap: 10 }}>
        <Input placeholder="Tìm vận đơn..." prefix={<SearchOutlined />} style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />}>{!isMobile && 'Tạo đơn'}</Button>
      </div>

      {/* HIỂN THỊ DỮ LIỆU */}
      {isMobile ? (
        // GIAO DIỆN MOBILE (DẠNG THẺ) - FIX LỖI CHỮ DỌC
        <List
          loading={loading}
          dataSource={data}
          renderItem={(item) => (
            <Card style={{ marginBottom: 10, borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{item.waybillCode}</Text>
                <Tag color={item.status === 'DELIVERED' ? 'green' : (item.status === 'DELIVERING' ? 'blue' : 'orange')}>
                  {item.status}
                </Tag>
              </div>
              
              <div style={{ fontSize: 13, color: '#666', marginBottom: 5 }}>
                <CarOutlined /> {item.providerId} | {dayjs(item.createdAt).format('DD/MM/YY')}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                 <div>
                    <div style={{fontSize: 12, color:'#888'}}>Tiền thu hộ (COD)</div>
                    <div style={{fontWeight: 'bold', color: '#cf1322', fontSize: 16}}>{Number(item.codAmount).toLocaleString()}đ</div>
                 </div>
                 <Button icon={<PrinterOutlined />}>In</Button>
              </div>
            </Card>
          )}
        />
      ) : (
        // GIAO DIỆN PC (DẠNG BẢNG)
        <Card bordered={false} style={{ borderRadius: 8 }}>
           <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
        </Card>
      )}
    </div>
  );
};

export default WaybillListPage;