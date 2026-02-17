import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin, Empty, Avatar } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined, RightOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import axiosClient from './api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// HÀM DỊCH: BIẾN UUID THÀNH TÊN NGƯỜI DÙNG HIỂU ĐƯỢC
// (Sau này Backend trả về tên thì ta sửa lại logic này sau)
const getProviderName = (id: string) => {
    if (!id) return 'Không XĐ';
    const idStr = id.toString().toLowerCase();
    // Giả lập mapping dựa trên các ID trong hình anh gửi
    // Anh có thể map lại đúng ID trong Database của anh
    if (idStr.startsWith('1cc9')) return 'Nhất Tín';
    if (idStr.startsWith('336a')) return 'GrabExpress'; 
    if (idStr.startsWith('3df5')) return 'Ahamove';
    if (idStr.startsWith('72b2')) return 'Giao Hàng Nhanh';
    // Nếu không khớp, cắt ngắn mã cho đẹp (VD: P-A1B2)
    return `ĐVVC-${idStr.substring(0, 4).toUpperCase()}`;
};

const getProviderColor = (name: string) => {
    if (name.includes('Nhất Tín')) return '#cf1322'; // Đỏ
    if (name.includes('Grab')) return '#096dd9';     // Xanh lá/Blue
    if (name.includes('Ahamove')) return '#d46b08';  // Cam
    return '#1890ff'; // Mặc định
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, delivering: 0, delivered: 0, totalCod: 0 });
  const [providerData, setProviderData] = useState<any[]>([]);
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axiosClient.get('/tms/waybill');
      const data = res.data;
      
      const total = data.length;
      const delivering = data.filter((x: any) => x.status === 'DELIVERING').length;
      const delivered = data.filter((x: any) => x.status === 'DELIVERED').length;
      const totalCod = data.reduce((sum: number, item: any) => sum + Number(item.codAmount || 0), 0);
      
      setStats({ total, delivering, delivered, totalCod });

      // Xử lý dữ liệu biểu đồ (Group theo TÊN thay vì ID)
      const providerCounts = data.reduce((acc:any, curr:any) => {
          const name = getProviderName(curr.providerId); // <--- DỊCH TÊN Ở ĐÂY
          acc[name] = (acc[name] || 0) + 1;
          return acc;
      }, {});
      
      const chartData = Object.keys(providerCounts).map(key => ({
          name: key, value: providerCounts[key]
      }));

      setProviderData(chartData.length > 0 ? chartData : [{name: 'Chưa có', value: 0}]);
      setRecentWaybills(data.slice(0, 5)); 
    } catch (error) { 
      console.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Component Card nhỏ tối ưu Mobile
  const StatCard = ({ title, value, icon, color, bg }: any) => (
    <Card bordered={false} bodyStyle={{ padding: '12px 10px' }} style={{ borderRadius: 12, background: bg, boxShadow: 'none' }}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
         <div>
            <div style={{fontSize: 11, color: '#666', marginBottom: 4}}>{title}</div>
            <div style={{fontSize: 22, fontWeight: 700, color: color, lineHeight: 1}}>{value}</div>
         </div>
         <div style={{fontSize: 24, opacity: 0.8, color: color}}>{icon}</div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '10px 15px', maxWidth: 1000, margin: '0 auto' }}>
      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
        <>
          <div style={{marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'end'}}>
             <div>
                <Title level={4} style={{ margin: 0, color: '#001529' }}>Tổng Quan</Title>
                <Text type="secondary" style={{fontSize: 11}}>Cập nhật: {dayjs().format('HH:mm DD/MM')}</Text>
             </div>
             <Avatar style={{backgroundColor: '#87d068'}} icon={<CarOutlined />} />
          </div>
          
          {/* 1. KHỐI SỐ LIỆU (GRID ĐỀU) */}
          <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <StatCard title="Tổng đơn" value={stats.total} icon={<ShoppingOutlined />} color="#096dd9" bg="#e6f7ff" />
            </Col>
            <Col xs={12} sm={6}>
               {/* Sửa text "Đang giao" ngắn gọn */}
              <StatCard title="Đang giao" value={stats.delivering} icon={<CarOutlined />} color="#d46b08" bg="#fff7e6" />
            </Col>
            <Col xs={12} sm={6}>
              <StatCard title="Hoàn tất" value={stats.delivered} icon={<CheckCircleOutlined />} color="#389e0d" bg="#f6ffed" />
            </Col>
            <Col xs={12} sm={6}>
              {/* Format tiền gọn gàng hơn */}
              <StatCard title="Tiền COD" value={`${(stats.totalCod/1000000).toFixed(1)}M`} icon={<DollarOutlined />} color="#c41d7f" bg="#fff0f6" />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* 2. BIỂU ĐỒ (Sửa lỗi mất chữ) */}
            <Col xs={24} md={14}>
              <Card title="Thị phần vận chuyển" bordered={false} style={{ borderRadius: 12 }} bodyStyle={{padding: '10px 0 10px 0'}}>
                 {stats.total === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                   <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={providerData} layout="vertical" margin={{ left: 10, right: 40, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        {/* Tăng width trục Y để hiển thị đủ tên */}
                        <YAxis dataKey="name" type="category" width={90} style={{fontSize: 11, fontWeight: 600}} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                          {providerData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                 )}
              </Card>
            </Col>

            {/* 3. DANH SÁCH (Sửa lỗi che mất tiền) */}
            <Col xs={24} md={10}>
              <Card 
                title={<span style={{fontSize: 14}}>Đơn vừa tạo</span>} 
                extra={<RightOutlined style={{fontSize: 12}}/>} 
                bordered={false} 
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{padding: '0 12px'}}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={recentWaybills}
                  renderItem={(item: any) => {
                    const pName = getProviderName(item.providerId);
                    return (
                    <List.Item style={{padding: '12px 0', borderBottom: '1px solid #f0f0f0'}}>
                      <List.Item.Meta
                        avatar={
                           <div style={{marginTop: 4}}>
                               {item.status==='DELIVERED' 
                                 ? <CheckCircleOutlined style={{fontSize: 20, color: '#52c41a'}}/> 
                                 : <CarOutlined style={{fontSize: 20, color: '#1890ff'}}/>
                               }
                           </div>
                        }
                        title={
                            <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                                {/* Mã đơn hàng */}
                                <Text strong style={{fontSize: 13}}>{item.waybillCode}</Text>
                                {/* Giá tiền (Không bị che nữa) */}
                                <Text strong style={{fontSize: 13, color: '#cf1322'}}>
                                    {(Number(item.codAmount)/1000).toFixed(0)}k
                                </Text>
                            </div>
                        }
                        description={
                          <div style={{display:'flex', justifyContent:'space-between', marginTop: 4}}>
                            {/* Tên ĐVVC (Đã dịch + Cắt ngắn nếu dài) */}
                            <Tag color={getProviderColor(pName)} style={{margin: 0, fontSize: 10, border: 'none'}}>
                                {pName}
                            </Tag>
                            <span style={{fontSize: 10, color: '#999'}}>{dayjs(item.createdAt).format('DD/MM')}</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}}
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