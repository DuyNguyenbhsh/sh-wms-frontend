import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin, Empty } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import axiosClient from './api/axiosClient'; // <--- DÙNG CÁI MỚI NÀY
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, delivering: 0, delivered: 0, totalCod: 0 });
  const [providerData, setProviderData] = useState<any[]>([]);
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      // Gọi qua axiosClient đã cấu hình sẵn URL chuẩn
      const res = await axiosClient.get('/tms/waybill');
      const data = res.data;
      
      // Tính toán lại số liệu thực tế
      const total = data.length;
      const delivering = data.filter((x: any) => x.status === 'DELIVERING').length;
      const delivered = data.filter((x: any) => x.status === 'DELIVERED').length;
      const totalCod = data.reduce((sum: number, item: any) => sum + Number(item.codAmount || 0), 0);
      
      setStats({ total, delivering, delivered, totalCod });

      // Xử lý dữ liệu biểu đồ (Group by Provider)
      const providerCounts = data.reduce((acc:any, curr:any) => {
          const key = curr.providerId || 'Khác';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
      }, {});
      
      const chartData = Object.keys(providerCounts).map(key => ({
          name: key, value: providerCounts[key]
      }));

      setProviderData(chartData.length > 0 ? chartData : [{name: 'Chưa có', value: 0}]);
      setRecentWaybills(data.slice(0, 5)); // Lấy 5 đơn mới nhất
    } catch (error) { 
      console.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Component Card nhỏ để tái sử dụng và đồng bộ UI
  const StatCard = ({ title, value, icon, color, bg }: any) => (
    <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ borderRadius: 12, background: bg, boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
      <Statistic 
        title={<Text type="secondary" style={{fontSize: 12}}>{title}</Text>}
        value={value} 
        prefix={icon} 
        valueStyle={{ color: color, fontSize: 20, fontWeight: 700 }} 
      />
    </Card>
  );

  return (
    <div style={{ padding: '10px 15px', maxWidth: 1200, margin: '0 auto' }}>
      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
        <>
          <div style={{marginBottom: 15}}>
             <Title level={4} style={{ margin: 0, color: '#001529' }}>Tổng Quan Vận Hành</Title>
             <Text type="secondary" style={{fontSize: 12}}>Cập nhật: {dayjs().format('HH:mm DD/MM/YYYY')}</Text>
          </div>
          
          {/* 1. KHỐI THỐNG KÊ (GRID CHUẨN UI MOBILE) */}
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={6}>
              <StatCard title="Tổng đơn" value={stats.total} icon={<ShoppingOutlined />} color="#1890ff" bg="#e6f7ff" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard title="Đang giao" value={stats.delivering} icon={<CarOutlined />} color="#fa8c16" bg="#fff7e6" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard title="Đã xong" value={stats.delivered} icon={<CheckCircleOutlined />} color="#52c41a" bg="#f6ffed" />
            </Col>
            <Col xs={12} md={6}>
              <StatCard title="Tiền COD" value={stats.totalCod} icon={<DollarOutlined />} color="#eb2f96" bg="#fff0f6" />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* 2. BIỂU ĐỒ */}
            <Col xs={24} md={14}>
              <Card title="Tỷ trọng ĐVVC" bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                 {stats.total === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" /> : (
                   <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={providerData} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={70} style={{fontSize: 11, fontWeight: 500}} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" barSize={15} radius={[0, 4, 4, 0]}>
                          {providerData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                 )}
              </Card>
            </Col>

            {/* 3. DANH SÁCH MỚI */}
            <Col xs={24} md={10}>
              <Card title="Vận đơn mới nhất" bordered={false} style={{ borderRadius: 12, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentWaybills}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn hàng" /> }}
                  renderItem={(item: any) => (
                    <List.Item style={{padding: '12px 0', borderBottom: '1px solid #f5f5f5'}}>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                              background: item.status==='DELIVERED'?'#f6ffed':'#e6f7ff', 
                              padding: 8, borderRadius: 8, color: item.status==='DELIVERED'?'#52c41a':'#1890ff'
                          }}>
                              {item.status==='DELIVERED' ? <CheckCircleOutlined /> : <CarOutlined />}
                          </div>
                        }
                        title={<Text strong style={{fontSize: 13}}>{item.waybillCode}</Text>}
                        description={
                          <div style={{fontSize: 11, color: '#888', marginTop: 2}}>
                            <span style={{marginRight: 8}}>{dayjs(item.createdAt).format('DD/MM')}</span>
                            <Tag color="geekblue" style={{fontSize: 10, lineHeight: '18px'}}>{item.providerId}</Tag>
                          </div>
                        }
                      />
                      <div style={{textAlign: 'right'}}>
                         <Text strong style={{color: '#cf1322', fontSize: 13, display: 'block'}}>{Number(item.codAmount).toLocaleString()}</Text>
                         <Text type="secondary" style={{fontSize: 10}}>VNĐ</Text>
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