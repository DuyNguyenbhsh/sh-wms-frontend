import { useState } from 'react';
import { Card, Button, Input, List, Tag, message, Typography, Modal, Tabs, Badge, Divider, Row, Col, Spin, Empty } from 'antd';
import { 
  CarOutlined, PhoneOutlined, EnvironmentOutlined, 
  CheckCircleOutlined, LogoutOutlined, 
  ShopOutlined, HistoryOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const DriverApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [tasks, setTasks] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1'); 

  // MOCK DATA SẢN PHẨM
  const renderProducts = (itemsStr: string) => {
    return (
      <div style={{ background: '#f0f5ff', padding: 8, borderRadius: 4, marginTop: 10 }}>
        <div style={{fontWeight:'bold', borderBottom:'1px solid #d9d9d9', marginBottom: 5, paddingBottom: 5}}>Thông tin đơn hàng</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
           <span style={{color: '#1890ff'}}>LINH.KIEN.PC</span>
           <b>SL: 1</b>
        </div>
        <div style={{fontSize: 12, color: '#666'}}>{itemsStr || 'Chi tiết hàng hóa...'}</div>
      </div>
    )
  }

  // 1. LOGIN
  const handleLogin = () => {
    if(vehiclePlate.trim()) {
       setIsLoggedIn(true);
       fetchTasks(vehiclePlate);
    } else {
       message.warning('Vui lòng nhập biển số!');
    }
  };

  // 2. TẢI ĐƠN HÀNG
  const fetchTasks = async (plate: string) => {
    setLoading(true);
    try {
      const res = await axios.get('http://192.168.2.90:3000/tms/waybill');
      const search = plate.toLowerCase().trim();
      
      const myJobs = res.data.filter((w: any) => {
         const wPlate = (w.vehiclePlate || '').toLowerCase();
         const wDriver = (w.driverName || '').toLowerCase();
         const wProvider = (w.providerId || '').toLowerCase();
         // Lấy cả đơn ĐÃ GIAO để hiện lịch sử
         return wPlate.includes(search) || wDriver.includes(search) || wProvider.includes(search);
      });
      setTasks(myJobs);
    } catch (error) {
      message.error('Lỗi kết nối Server');
    }
    setLoading(false);
  };

  // 3. HÀNH ĐỘNG: LẤY HÀNG
  const handlePickup = (waybill: any) => {
    Modal.confirm({
      title: 'Xác nhận lấy hàng?',
      content: 'Bạn đã nhận đủ hàng từ kho?',
      okText: 'Đã lấy',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.patch(`http://192.168.2.90:3000/tms/waybill/${waybill.id}`, { status: 'DELIVERING' });
          message.success('Đã nhận hàng!');
          fetchTasks(vehiclePlate); 
          setActiveTab('2'); 
        } catch (e) { message.error('Lỗi mạng'); }
      }
    });
  };

  // 4. HÀNH ĐỘNG: GIAO THÀNH CÔNG
  const handleComplete = (waybill: any) => {
    Modal.confirm({
      title: 'Xác nhận hoàn tất?',
      content: `Đã thu ${parseInt(waybill.codAmount||0).toLocaleString()}đ?`,
      okText: 'Hoàn tất',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.patch(`http://192.168.2.90:3000/tms/waybill/${waybill.id}`, {
            status: 'DELIVERED',
            codStatus: 'PENDING'
          });
          message.success('Đơn hàng đã chuyển vào Lịch sử!');
          fetchTasks(vehiclePlate);
          setActiveTab('3'); // Tự động nhảy sang tab Lịch sử
        } catch (e) { message.error('Lỗi mạng'); }
      }
    });
  };

  // MÀN HÌNH LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <CarOutlined style={{ fontSize: 60, color: '#1890ff' }} />
          <Title level={3} style={{marginTop: 10}}>SH Driver App</Title>
        </div>
        <Card bordered={false} style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
          <Input size="large" placeholder="Nhập Biển số / Mã tài xế" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} style={{marginBottom: 20}} />
          <Button type="primary" block size="large" onClick={handleLogin}>ĐĂNG NHẬP</Button>
        </Card>
      </div>
    );
  }

  // PHÂN LOẠI DATA
  const pickupList = tasks.filter(t => t.status === 'READY_TO_PICK' || t.status === 'ASSIGNED');
  const deliveringList = tasks.filter(t => t.status === 'DELIVERING');
  const historyList = tasks.filter(t => t.status === 'DELIVERED' || t.status === 'RETURNED'); // <--- Thêm list này

  // Chọn list hiển thị
  let currentList = pickupList;
  if (activeTab === '2') currentList = deliveringList;
  if (activeTab === '3') currentList = historyList;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#001529', padding: '15px 15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{fontWeight: 'bold', fontSize: 15}}><CarOutlined /> {vehiclePlate}</div>
        </div>
        <Button ghost size="small" icon={<LogoutOutlined />} onClick={() => setIsLoggedIn(false)}>Thoát</Button>
      </div>

      <div style={{background: '#fff', padding: '0 5px'}}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
           { key: '1', label: <Badge count={pickupList.length} offset={[10,0]} size="small">CẦN LẤY</Badge> },
           { key: '2', label: <Badge count={deliveringList.length} color="green" offset={[10,0]} size="small">ĐANG GIAO</Badge> },
           { key: '3', label: <span style={{color: '#666'}}><HistoryOutlined /> LỊCH SỬ</span> }
        ]} />
      </div>

      <div style={{ padding: 10 }}>
        {loading && <Spin style={{display:'block', margin:'20px auto'}}/>}
        
        {!loading && currentList.length === 0 && <Empty description="Không có đơn hàng" style={{marginTop: 50}} />}

        <List
          dataSource={currentList}
          renderItem={item => (
            <Card style={{ marginBottom: 15, borderRadius: 8, opacity: activeTab==='3' ? 0.8 : 1 }} bodyStyle={{padding: 0}}>
               <div style={{padding: '10px 15px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', 
                   background: activeTab==='1'?'#fffbe6': (activeTab==='2'?'#f6ffed':'#f0f0f0')}}>
                  <Text strong>{item.waybillCode}</Text>
                  {activeTab === '3' && <Tag color="green">HOÀN TẤT</Tag>}
               </div>

               <div style={{padding: 15}}>
                  <div style={{marginBottom: 10}}>
                     <Text type="secondary">Khách hàng:</Text>
                     <div style={{fontWeight: 'bold', fontSize: 16}}>{item.customerName}</div>
                     <div style={{color: '#1890ff'}} onClick={()=>window.open(`tel:${item.phone}`)}><PhoneOutlined /> {item.phone}</div>
                     <div style={{color: '#666', fontSize: 13}}><EnvironmentOutlined /> {item.address}</div>
                  </div>

                  {renderProducts(item.items)}

                  <Divider style={{margin: '10px 0'}} />
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <Text>Thu hộ (COD):</Text>
                     <Text strong style={{fontSize: 18, color: '#cf1322'}}>{parseInt(item.codAmount||0).toLocaleString()} đ</Text>
                  </div>
               </div>

               {/* NÚT BẤM - CHỈ HIỆN Ở TAB 1 VÀ 2 */}
               <Row>
                 {activeTab === '1' && (
                   <Col span={24}>
                     <Button type="primary" block size="large" style={{borderRadius: 0, height: 45}} onClick={() => handlePickup(item)}>
                        <ShopOutlined /> XÁC NHẬN LẤY
                     </Button>
                   </Col>
                 )}
                 {activeTab === '2' && (
                   <>
                     <Col span={12}><Button block size="large" danger style={{borderRadius: 0, height: 45, borderRight: 'none'}}>HUỶ</Button></Col>
                     <Col span={12}>
                        <Button type="primary" block size="large" style={{borderRadius: 0, height: 45, background: '#52c41a', borderColor: '#52c41a'}} onClick={() => handleComplete(item)}>
                           <CheckCircleOutlined /> ĐÃ GIAO
                        </Button>
                     </Col>
                   </>
                 )}
               </Row>
            </Card>
          )}
        />
        
        {/* TỔNG KẾT CUỐI NGÀY Ở TAB LỊCH SỬ */}
        {activeTab === '3' && historyList.length > 0 && (
            <div style={{textAlign: 'center', padding: 20, background: '#fff', borderRadius: 8, marginTop: 10}}>
                <Text type="secondary">Tổng tiền COD hôm nay:</Text>
                <Title level={3} style={{margin: 0, color: '#cf1322'}}>
                    {historyList.reduce((sum, i) => sum + parseInt(i.codAmount||0), 0).toLocaleString()} đ
                </Title>
                <Text type="secondary">(Vui lòng nộp lại cho Kế toán)</Text>
            </div>
        )}
      </div>
    </div>
  );
};

export default DriverApp;