import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Avatar, Space, Typography, Breadcrumb, Badge, Button, Drawer } from 'antd';
import {
  PieChartOutlined, RocketOutlined, PlusCircleOutlined, SendOutlined,
  HistoryOutlined, DatabaseOutlined, CarOutlined, FileOutlined,
  ShopOutlined, UserOutlined, BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckCircleOutlined, DollarOutlined
} from '@ant-design/icons';

// --- IMPORT CÁC TRANG ---
import DashboardPage from './DashboardPage';       
import CreateWaybillPage from './CreateWaybillPage'; 
import DispatchPage from './DispatchPage';         
import WaybillListPage from './WaybillListPage';   
import VehiclesPage from './VehiclesPage';         
import ProductsPage from './ProductsPage';         
import MasterDataPage from './MasterDataPage';     
import PodPage from './PodPage';
import CodReconciliationPage from './CodReconciliationPage';                   

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  const [isMobile, setIsMobile] = useState(false); // Biến kiểm tra Mobile
  
  const { token: { colorBgContainer } } = theme.useToken();

  // Tự động phát hiện màn hình điện thoại
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true); // Nếu là mobile thì tự đóng menu
    };
    handleResize(); // Chạy ngay lần đầu
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    { key: '1', icon: <PieChartOutlined />, label: 'Dashboard' },
    {
      key: 'sub1', label: 'Nghiệp vụ Vận chuyển', icon: <RocketOutlined />,
      children: [
        { key: '2', label: 'Tạo vận đơn', icon: <PlusCircleOutlined /> },
        { key: '3', label: 'Điều phối giao vận', icon: <SendOutlined /> },
        { key: '4', label: 'Vận đơn chờ xuất', icon: <HistoryOutlined /> },
        { key: '8', label: 'Xác nhận giao (POD)', icon: <CheckCircleOutlined /> },
        { key: '9', label: 'Đối soát COD', icon: <DollarOutlined /> },
      ],
    },
    {
      key: 'sub2', label: 'Danh mục (Master)', icon: <DatabaseOutlined />,
      children: [
        { key: '5', label: 'Phương tiện / Xe', icon: <CarOutlined /> },
        { key: '6', label: 'Hàng hóa / SP', icon: <FileOutlined /> },
        { key: '7', label: 'Cấu hình vận chuyển', icon: <ShopOutlined /> },
      ],
    },
    { key: '10', icon: <UserOutlined />, label: 'Hệ thống' },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case '1': return <DashboardPage />;
      case '2': return <CreateWaybillPage />;
      case '3': return <DispatchPage />;
      case '4': return <WaybillListPage />;
      case '5': return <VehiclesPage />;
      case '6': return <ProductsPage />;
      case '7': return <MasterDataPage />;
      case '8': return <PodPage />;
      case '9': return <CodReconciliationPage />;
      default: return <div>Đang xây dựng...</div>;
    }
  };

  const getBreadcrumbTitle = () => {
    if (selectedKey === '1') return 'Dashboard';
    return 'Hệ thống quản lý';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDER CHO DESKTOP (Ẩn đi nếu là Mobile) */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={260} 
               style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', fontWeight: 'bold', borderRadius: 6 }}>
             {collapsed ? 'WMS' : 'SH WMS'}
          </div>
          <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} onClick={(e) => setSelectedKey(e.key)} selectedKeys={[selectedKey]} />
        </Sider>
      )}

      {/* DRAWER CHO MOBILE (Menu trượt ra) */}
      <Drawer
        title="SH WMS"
        placement="left"
        onClose={() => setCollapsed(true)}
        open={isMobile && !collapsed}
        bodyStyle={{ padding: 0 }}
        width={260}
      >
        <Menu theme="light" mode="inline" items={items} onClick={(e) => {
            setSelectedKey(e.key);
            setCollapsed(true); // Chọn xong tự đóng lại
        }} selectedKeys={[selectedKey]} />
      </Drawer>
      
      {/* NỘI DUNG CHÍNH */}
      <Layout style={{ 
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 260), // Mobile thì không chừa lề trái
          transition: 'all 0.2s' 
      }}>
        <Header style={{ padding: '0 15px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
             <Button type="text" 
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                onClick={() => setCollapsed(!collapsed)} 
                style={{ fontSize: '16px', width: 64, height: 64 }} 
             />
             {!isMobile && <Breadcrumb items={[{ title: 'Hệ thống' }, { title: <b>{getBreadcrumbTitle()}</b> }]} />}
           </div>
           <Space size={isMobile ? "small" : "large"}>
              <Badge count={5} size="small"><BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Badge>
              {!isMobile && <span style={{ fontWeight: 500 }}>Nguyễn Trí Duy</span>}
              <Avatar style={{ backgroundColor: '#f56a00' }} icon={<UserOutlined />} />
           </Space>
        </Header>
        
        <Content style={{ margin: '16px 16px', overflow: 'initial' }}>{renderContent()}</Content>
        <Footer style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>SHVisionary WMS ©2026</Footer>
      </Layout>
    </Layout>
  );
};

export default App;