import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Spin, Empty, Avatar, Grid, Table } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined, RightOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import axiosClient from './api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid; // Hook để phân biệt Mobile/Laptop

// --- LOGIC XỬ LÝ DỮ LIỆU ---
const getProviderName = (id: string) => {
    if (!id) return 'Không XĐ';
    const idStr = id.toString().toLowerCase();
    if (idStr.startsWith('1cc9')) return 'Nhất Tín';
    if (idStr.startsWith('336a')) return 'GrabExpress'; 
    if (idStr.startsWith('3df5')) return 'Ahamove';
    if (idStr.startsWith('72b2')) return 'Giao Hàng Nhanh';
    return `ĐVVC-${idStr.substring(0, 4).toUpperCase()}`;
};

const getProviderColor = (name: string) => {
    if (name.includes('Nhất Tín')) return '#cf1322';
    if (name.includes('Grab')) return '#096dd9';
    if (name.includes('Ahamove')) return '#d46b08';
    return '#1890ff';
};

const DashboardPage = () => {
  const screens = useBreakpoint(); // Check màn hình: screens.md = true là Laptop
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, delivering: 0, delivered: 0, totalCod: 0 });
  const [providerData, setProviderData] = useState<any[]>([]);
  const [recentWaybills, setRecentWaybills] = useState<any[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axiosClient.get('/tms/waybill');
      const data = res.data;
      
      setStats({
        total: data.length,
        delivering: data.filter((x: any) => x.status === 'DELIVERING').length,
        delivered: data.filter((x: any) => x.status === 'DELIVERED').length,
        totalCod: data.reduce((sum: number, item: any) => sum + Number(item.codAmount || 0), 0)
      });

      const providerCounts = data.reduce((acc:any, curr:any) => {
          const name = getProviderName(curr.providerId);
          acc[name] = (acc[name] || 0) + 1;
          return acc;
      }, {});
      
      const chartData = Object.keys(providerCounts).map(key => ({ name: key, value: providerCounts[key] }));
      setProviderData(chartData.length > 0 ? chartData : [{name: 'Chưa có', value: 0}]);
      setRecentWaybills(data.slice(0, 8)); // Laptop lấy 8 đơn, Mobile hiển thị ít hơn
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // --- COMPONENT CHO LAPTOP (BẢNG DỮ LIỆU CHUYÊN NGHIỆP) ---
  const desktopColumns = [
    { title: 'Mã vận đơn', dataIndex: 'waybillCode', render: (t:string) => <b>{t}</b> },
    { title: 'ĐVVC', dataIndex: 'providerId', render: (id:string) => {
        const name = getProviderName(id);
        return <Tag color={getProviderColor(name)}>{name}</Tag>
    }},
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: (d:string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    { title: 'COD', dataIndex: 'codAmount', align: 'right' as const, render: (v:any) => <b style={{color: '#cf1322'}}>{Number(v).toLocaleString()}đ</b> },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center' as const, render: (s:string) => 
        s === 'DELIVERED' ? <Tag color="success">HOÀN TẤT</Tag> : <Tag color="processing">ĐANG GIAO</Tag> 
    },
  ];

  // --- COMPONENT CHO MOBILE (CARD GỌN GÀNG) ---
  const MobileList = () => (
    <List
      itemLayout="horizontal"
      dataSource={recentWaybills.slice(0, 5)} // Mobile chỉ hiện 5 đơn
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
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <Text strong style={{fontSize: 13}}>{item.waybillCode}</Text>
                    <Text strong style={{fontSize: 13, color: '#cf1322'}}>{(Number(item.codAmount)/1000).toFixed(0)}k</Text>
                </div>
            }
            description={
              <div style={{display:'flex', justifyContent:'space-between', marginTop: 4}}>
                <Tag color={getProviderColor(pName)} style={{margin: 0, fontSize: 10}}>{pName}</Tag>
                <span style={{fontSize: 10, color: '#999'}}>{dayjs(item.createdAt).format('DD/MM')}</span>
              </div>
            }
          />
        </List.Item>
      )}}
    />
  );

  const StatCard = ({ title, value, icon, color, bg }: any) => (
    <Card bordered={false} bodyStyle={{ padding: screens.md ? 20 : 12 }} style={{ borderRadius: 12, background: bg }}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
         <div>
            <div style={{fontSize: screens.md ? 14 : 11, color: '#666', marginBottom: 4}}>{title}</div>
            <div style={{fontSize: screens.md ? 28 : 22, fontWeight: 700, color: color, lineHeight: 1}}>{value}</div>
         </div>
         <div style={{fontSize: screens.md ? 32 : 24, opacity: 0.8, color: color}}>{icon}</div>
      </div>
    </Card>
  );

  return (
    // NẾU LÀ LAPTOP (screens.md) THÌ KHÔNG GIỚI HẠN MAX-WIDTH, PAD RỘNG HƠN
    <div style={{ padding: screens.md ? '24px' : '10px 15px', maxWidth: screens.md ? '100%' : 600, margin: '0 auto' }}>
      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
        <>
          <div style={{marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'end'}}>
             <div>
                <Title level={screens.md ? 3 : 4} style={{ margin: 0, color: '#001529' }}>Tổng Quan</Title>
                <Text type="secondary" style={{fontSize: 12}}>Dữ liệu Real-time</Text>
             </div>
             {/* Laptop hiện nút reload, Mobile thì ẩn cho gọn */}
             {screens.md && <Avatar style={{backgroundColor: '#1890ff', cursor:'pointer'}} icon={<CarOutlined />} onClick={fetchDashboardData}/>}
          </div>
          
          <Row gutter={[screens.md ? 24 : 10, screens.md ? 24 : 10]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6} md={6}>
              <StatCard title="Tổng đơn" value={stats.total} icon={<ShoppingOutlined />} color="#096dd9" bg="#e6f7ff" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <StatCard title="Đang giao" value={stats.delivering} icon={<CarOutlined />} color="#d46b08" bg="#fff7e6" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <StatCard title="Hoàn tất" value={stats.delivered} icon={<CheckCircleOutlined />} color="#389e0d" bg="#f6ffed" />
            </Col>
            <Col xs={12} sm={6} md={6}>
              <StatCard title="Tiền COD" value={screens.md ? `${stats.totalCod.toLocaleString()}đ` : `${(stats.totalCod/1000000).toFixed(1)}M`} icon={<DollarOutlined />} color="#c41d7f" bg="#fff0f6" />
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            {/* BIỂU ĐỒ */}
            <Col xs={24} md={10}>
              <Card title="Thị phần vận chuyển" bordered={false} style={{ borderRadius: 12, height: '100%' }}>
                   <ResponsiveContainer width="100%" height={screens.md ? 300 : 220}>
                      <BarChart data={providerData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={screens.md ? 100 : 80} style={{fontSize: 12, fontWeight: 600}} tickLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" barSize={screens.md ? 30 : 20} radius={[0, 4, 4, 0]}>
                          {providerData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
              </Card>
            </Col>

            {/* DANH SÁCH: LAPTOP DÙNG TABLE, MOBILE DÙNG LIST */}
            <Col xs={24} md={14}>
              <Card 
                title="Đơn hàng gần đây" 
                extra={<RightOutlined />} 
                bordered={false} 
                style={{ borderRadius: 12, height: '100%', overflow: 'hidden' }}
                bodyStyle={{padding: screens.md ? '0' : '0 12px'}} // Laptop bỏ padding để Table tràn viền đẹp
              >
                {screens.md ? (
                    // GIAO DIỆN LAPTOP: TABLE RỘNG RÃI
                    <Table 
                        dataSource={recentWaybills} 
                        columns={desktopColumns} 
                        pagination={false} 
                        rowKey="id"
                        size="middle"
                    />
                ) : (
                    // GIAO DIỆN MOBILE: LIST GỌN GÀNG
                    <MobileList />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
export default DashboardPage;