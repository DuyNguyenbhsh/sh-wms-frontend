import React, { useState } from 'react';
import { Layout, Menu, theme, Avatar, Space, Typography, Breadcrumb, Badge, Button } from 'antd';
import {
  PieChartOutlined, RocketOutlined, PlusCircleOutlined, SendOutlined,
  HistoryOutlined, DatabaseOutlined, CarOutlined, FileOutlined,
  ShopOutlined, UserOutlined, BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckCircleOutlined, // <--- Icon cho POD
  DollarOutlined
} from '@ant-design/icons';

// --- IMPORT CÁC TRANG ---
import DashboardPage from './DashboardPage';       // Menu 1
import CreateWaybillPage from './CreateWaybillPage'; // Menu 2
import DispatchPage from './DispatchPage';         // Menu 3
import WaybillListPage from './WaybillListPage';   // Menu 4
import VehiclesPage from './VehiclesPage';         // Menu 5
import ProductsPage from './ProductsPage';         // Menu 6 (Nếu có)
import MasterDataPage from './MasterDataPage';     // Menu 7
import PodPage from './PodPage';                   // Menu 8 (MỚI)
import CodReconciliationPage from './CodReconciliationPage'; // Trang đối soát COD (MỚI)

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  
  const { token: { colorBgContainer } } = theme.useToken();

  // Cấu trúc Menu
  const items = [
    { key: '1', icon: <PieChartOutlined />, label: 'Dashboard' },
    {
      key: 'sub1',
      label: 'Nghiệp vụ Vận chuyển',
      icon: <RocketOutlined />,
      children: [
        { key: '2', label: 'Tạo vận đơn', icon: <PlusCircleOutlined /> },
        { key: '3', label: 'Điều phối giao vận', icon: <SendOutlined /> },
        { key: '4', label: 'Vận đơn chờ xuất', icon: <HistoryOutlined /> },
        { key: '8', label: 'Xác nhận giao (POD)', icon: <CheckCircleOutlined /> }, // <--- MỚI
        { key: '9', label: 'Đối soát COD', icon: <DollarOutlined /> },
      ],
    },
    {
      key: 'sub2',
      label: 'Danh mục (Master)',
      icon: <DatabaseOutlined />,
      children: [
        { key: '5', label: 'Phương tiện / Xe', icon: <CarOutlined /> },
        { key: '6', label: 'Hàng hóa / SP', icon: <FileOutlined /> },
        { key: '7', label: 'Cấu hình vận chuyển', icon: <ShopOutlined /> },
      ],
    },
    { key: '9', icon: <UserOutlined />, label: 'Hệ thống' },
  ];

  // Hàm điều hướng
  const renderContent = () => {
    switch (selectedKey) {
      case '1': return <DashboardPage />;
      case '2': return <CreateWaybillPage />;
      case '3': return <DispatchPage />;
      case '4': return <WaybillListPage />;
      case '5': return <VehiclesPage />;
      case '6': return <ProductsPage />;
      case '7': return <MasterDataPage />;
      case '8': return <PodPage />; // <--- Gọi trang POD
      case '9': return <CodReconciliationPage />;
      default: return <div>Đang xây dựng...</div>;
    }
  };

  // Tiêu đề Breadcrumb
  const getBreadcrumbTitle = () => {
    if (selectedKey === '1') return 'Dashboard';
    if (selectedKey === '8') return 'Nghiệp vụ / Xác nhận giao hàng (POD)';
    return 'Hệ thống quản lý';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} 
             style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', fontWeight: 'bold', borderRadius: 6 }}>
           {collapsed ? 'WMS' : 'SH WMS'}
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} onClick={(e) => setSelectedKey(e.key)} selectedKeys={[selectedKey]} />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
             <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64 }} />
             <Breadcrumb items={[{ title: 'Hệ thống' }, { title: <b>{getBreadcrumbTitle()}</b> }]} />
           </div>
           <Space size="large">
              <Badge count={5} size="small"><BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Badge>
              <Space style={{ cursor: 'pointer' }}><Avatar style={{ backgroundColor: '#f56a00' }} icon={<UserOutlined />} /><span style={{ fontWeight: 500 }}>Nguyễn Trí Duy</span></Space>
           </Space>
        </Header>
        <Content style={{ margin: '16px 16px', overflow: 'initial' }}>{renderContent()}</Content>
        <Footer style={{ textAlign: 'center', color: '#999' }}>SHVisionary WMS ©2026</Footer>
      </Layout>
    </Layout>
  );
};

export default App;