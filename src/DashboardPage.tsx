import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin } from 'antd';
import { 
  ShoppingOutlined, CarOutlined, DollarOutlined, 
  CheckCircleOutlined, SyncOutlined, ArrowUpOutlined 
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    delivering: 0,
    delivered: 0,
    totalCod: 0
  });
  const [providerData, setProviderData] = useState<any[]>([]);
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Gọi API lấy toàn bộ vận đơn để tính toán
      const res = await axios.get('http://localhost:3000/tms/waybill');
      const data = res.data;
      const providersRes = await axios.get('http://localhost:3000/master-data/providers');
      const providers = providersRes.data;

      // 1. Tính toán số liệu tổng quan (Metric Cards)
      const total = data.length;
      const delivering = data.filter((x: any) => x.status === 'DELIVERING').length;
      const delivered = data.filter((x: any) => x.status === 'DELIVERED').length;
      const totalCod = data.reduce((sum: number, item: any) => sum + Number(item.codAmount || 0), 0);

      setStats({ total, delivering, delivered, totalCod });

      // 2. Tính toán biểu đồ tỷ lệ ĐVVC (Pie Chart)
      // Group by providerId
      const groupByProvider = data.reduce((acc: any, item: any) => {
        const pName = providers.find((p: any) => p.id === item.providerId)?.name || 'Nội bộ';
        acc[pName] = (acc[pName] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.keys(groupByProvider).map(key => ({
        name: key,
        value: groupByProvider[key]
      }));
      setProviderData(chartData);

      // 3. Lấy 5 đơn hàng mới nhất
      setRecentWaybills(data.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Màu sắc cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div style={{ padding: 20 }}>
      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
        <>
          <Title level={3} style={{ marginBottom: 20, color: '#1890ff' }}>Tổng Quan Vận Hành</Title>
          
          {/* 1. CARDS SỐ LIỆU */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} style={{ borderRadius: 8, background: '#e6f7ff' }}>
                <Statistic 
                  title="Đơn hàng hôm nay" 
                  value={stats.total} 
                  prefix={<ShoppingOutlined />} 
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ borderRadius: 8, background: '#fff7e6' }}>
                <Statistic 
                  title="Đang giao hàng" 
                  value={stats.delivering} 
                  prefix={<CarOutlined />} 
                  valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ borderRadius: 8, background: '#f6ffed' }}>
                <Statistic 
                  title="Đã giao thành công" 
                  value={stats.delivered} 
                  prefix={<CheckCircleOutlined />} 
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} style={{ borderRadius: 8, background: '#fff0f6' }}>
                <Statistic 
                  title="Tổng tiền COD (Tạm tính)" 
                  value={stats.totalCod} 
                  prefix={<DollarOutlined />} 
                  suffix="đ"
                  groupSeparator=","
                  valueStyle={{ color: '#eb2f96', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={24}>
            {/* 2. BIỂU ĐỒ PHÂN BỔ ĐỐI TÁC */}
            <Col span={14}>
              <Card title="Tỷ trọng Đơn vị vận chuyển" bordered={false} style={{ borderRadius: 8, height: 400 }}>
                 <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={providerData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100}/>
                      <RechartsTooltip formatter={(value) => [value, 'Số lượng đơn']} />
                      <Bar dataKey="value" fill="#8884d8" barSize={30}>
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </Card>
            </Col>

            {/* 3. DANH SÁCH VỪA TẠO */}
            <Col span={10}>
              <Card title="Vận đơn mới nhất" bordered={false} style={{ borderRadius: 8, height: 400, overflow: 'auto' }}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentWaybills}
                  renderItem={(item: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="blue">{item.status}</Tag>}
                        title={<Text strong>{item.waybillCode}</Text>}
                        description={
                          <div style={{fontSize: 12}}>
                             COD: {parseInt(item.codAmount||0).toLocaleString()}đ <br/> 
                             {item.createdAt?.substring(0,10)}
                          </div>
                        }
                      />
                      <div>
                         {/* Logic hiển thị logo ĐVVC đơn giản */}
                         {item.providerId ? <CarOutlined style={{color:'#1890ff'}}/> : <ShoppingOutlined />}
                      </div>
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