import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Avatar, Space, Typography, Breadcrumb, Badge, Button, Drawer } from 'antd';
import {
  PieChartOutlined, RocketOutlined, PlusCircleOutlined, SendOutlined,
  HistoryOutlined, DatabaseOutlined, CarOutlined, FileOutlined,
  ShopOutlined, UserOutlined, BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckCircleOutlined, DollarOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate(); // Nút bấm chuyển trang
  const location = useLocation(); // Lấy đường dẫn hiện tại để active menu

  // Tự động phát hiện màn hình điện thoại
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cấu hình Menu với Key là các URL chuẩn chỉ
  const items = [
    { key: '/', icon: <PieChartOutlined />, label: 'Dashboard' },
    {
      key: 'sub1', label: 'Nghiệp vụ Vận chuyển', icon: <RocketOutlined />,
      children: [
        { key: '/create-waybill', label: 'Tạo vận đơn', icon: <PlusCircleOutlined /> },
        { key: '/dispatch', label: 'Điều phối giao vận', icon: <SendOutlined /> },
        { key: '/waybill-list', label: 'Vận đơn chờ xuất', icon: <HistoryOutlined /> },
        { key: '/pod', label: 'Xác nhận giao (POD)', icon: <CheckCircleOutlined /> },
        { key: '/cod-reconciliation', label: 'Đối soát COD', icon: <DollarOutlined /> },
      ],
    },
    {
      key: 'sub2', label: 'Danh mục (Master)', icon: <DatabaseOutlined />,
      children: [
        { key: '/vehicles', label: 'Phương tiện / Xe', icon: <CarOutlined /> },
        { key: '/products', label: 'Hàng hóa / SP', icon: <FileOutlined /> },
        { key: '/master-data', label: 'Cấu hình vận chuyển', icon: <ShopOutlined /> },
      ],
    },
    {
      key: 'sub3', label: 'Mua hàng (Procurement)', icon: <ShoppingCartOutlined />,
      children: [
        { key: '/po', label: 'Quản lý PO (Đơn mua)', icon: <ShoppingCartOutlined /> },
      ],
    },
    { key: '/system', icon: <UserOutlined />, label: 'Hệ thống' },
  ];

  // Hàm chuyển trang khi click vào Menu
  const handleMenuClick = (e: any) => {
    navigate(e.key); // Đẩy URL đi
    if (isMobile) setCollapsed(true); // Trên mobile bấm xong tự đóng menu
  };

  // Lấy tên Tiêu đề dựa trên URL hiện tại
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/po') return 'Mua hàng (PO)';
    if (path === '/create-waybill') return 'Tạo vận đơn';
    // Anh có thể bổ sung thêm các case khác nếu muốn hiện đẹp
    return 'Hệ thống quản lý';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDER CHO DESKTOP */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={260} 
               style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', fontWeight: 'bold', borderRadius: 6 }}>
             {collapsed ? 'WMS' : 'SH WMS'}
          </div>
          <Menu theme="dark" mode="inline" items={items} onClick={handleMenuClick} selectedKeys={[location.pathname]} />
        </Sider>
      )}

      {/* DRAWER CHO MOBILE */}
      <Drawer
        title="SH WMS"
        placement="left"
        onClose={() => setCollapsed(true)}
        open={isMobile && !collapsed}
        styles={{ body: { padding: 0 } }}
        width={260}
      >
        <Menu theme="light" mode="inline" items={items} onClick={handleMenuClick} selectedKeys={[location.pathname]} />
      </Drawer>
      
      {/* NỘI DUNG CHÍNH */}
      <Layout style={{ 
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 260),
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
        
        <Content style={{ margin: '16px 16px', overflow: 'initial' }}>
            {/* THAY VÌ DÙNG SWITCH CASE, TA DÙNG OUTLET. ĐÂY LÀ NƠI REACT ROUTER BƠM CÁC TRANG CON VÀO */}
            <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>SHVisionary WMS ©2026</Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;