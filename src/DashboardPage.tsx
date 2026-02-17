import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, delivering: 0, delivered: 0, totalCod: 0 });
  const [providerData, setProviderData] = useState<any[]>([]);
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Tự động lấy link
      const res = await axios.get(`${apiUrl}/tms/waybill`);
      const data = res.data;
      
      // Tính toán số liệu... (Giữ nguyên logic cũ)
      const total = data.length;
      const delivering = data.filter((x: any) => x.status === 'DELIVERING').length;
      const delivered = data.filter((x: any) => x.status === 'DELIVERED').length;
      const totalCod = data.reduce((sum: number, item: any) => sum + Number(item.codAmount || 0), 0);
      setStats({ total, delivering, delivered, totalCod });

      // Mock data biểu đồ đơn giản
      setProviderData([
         { name: 'Nhất Tín', value: 4 },
         { name: 'Ahamove', value: 2 },
         { name: 'Grab', value: 1 }
      ]);
      setRecentWaybills(data.slice(0, 5));
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div style={{ padding: '10px 15px' }}>
      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
        <>
          <Title level={4} style={{ marginBottom: 15, color: '#1890ff' }}>Tổng Quan Vận Hành</Title>
          
          {/* 1. CARDS SỐ LIỆU (RESPONSIVE) */}
          {/* xs=12: Điện thoại (2 ô/hàng). md=6: Máy tính (4 ô/hàng) */}
          <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} bodyStyle={{padding: 15}} style={{ borderRadius: 8, background: '#e6f7ff' }}>
                <Statistic title="Đơn hôm nay" value={stats.total} prefix={<ShoppingOutlined />} valueStyle={{ color: '#1890ff', fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} bodyStyle={{padding: 15}} style={{ borderRadius: 8, background: '#fff7e6' }}>
                <Statistic title="Đang giao" value={stats.delivering} prefix={<CarOutlined />} valueStyle={{ color: '#fa8c16', fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} bodyStyle={{padding: 15}} style={{ borderRadius: 8, background: '#f6ffed' }}>
                <Statistic title="Đã xong" value={stats.delivered} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a', fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bordered={false} bodyStyle={{padding: 15}} style={{ borderRadius: 8, background: '#fff0f6' }}>
                <Statistic title="Tiền COD" value={stats.totalCod} prefix={<DollarOutlined />} suffix="đ" groupSeparator="," valueStyle={{ color: '#eb2f96', fontSize: 18 }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* 2. BIỂU ĐỒ (Mobile: Full 100%, PC: 14/24) */}
            <Col xs={24} md={14}>
              <Card title="Tỷ trọng ĐVVC" bordered={false} style={{ borderRadius: 8 }}>
                 <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={providerData} layout="vertical" margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} style={{fontSize: 12}} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#8884d8" barSize={20} label={{ position: 'right' }}>
                        {providerData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </Card>
            </Col>

            {/* 3. DANH SÁCH (Mobile: Full 100%, PC: 10/24) */}
            <Col xs={24} md={10}>
              <Card title="Vận đơn mới" bordered={false} style={{ borderRadius: 8, height: '100%' }}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentWaybills}
                  renderItem={(item: any) => (
                    <List.Item style={{padding: '10px 0'}}>
                      <List.Item.Meta
                        avatar={<Tag color={item.status==='DELIVERED'?'green':'blue'}>{item.status==='DELIVERED'?'XONG':'GIAO'}</Tag>}
                        title={<Text style={{fontSize: 13}}>{item.waybillCode}</Text>}
                        description={<div style={{fontSize: 11, color: '#888'}}>{parseInt(item.codAmount).toLocaleString()}đ - {item.providerId}</div>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
export default DashboardPage;