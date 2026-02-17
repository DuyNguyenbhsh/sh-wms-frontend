import { useState, useEffect } from 'react';
import { Input, Button, Card, Result, Typography, Row, Col, message, Tag, Divider, Spin } from 'antd';
import { 
  ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SearchOutlined, CarOutlined, RocketOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PodPage = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [waybill, setWaybill] = useState<any>(null);
  const [recentAction, setRecentAction] = useState<string | null>(null);

  // Hàm tìm kiếm vận đơn
  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    setWaybill(null);
    setRecentAction(null);

    try {
      // Vì API hiện tại chưa có Search, ta lấy hết về lọc client (Tạm thời)
      // Thực tế sẽ gọi: GET /tms/waybill?code=XXX
      const res = await axios.get('http://localhost:3000/tms/waybill');
      const found = res.data.find((w: any) => w.waybillCode === keyword.trim());
      
      if (found) {
        setWaybill(found);
      } else {
        message.warning('Không tìm thấy vận đơn này!');
      }
    } catch (error) {
      message.error('Lỗi kết nối Server');
    }
    setLoading(false);
  };

  // Hàm cập nhật trạng thái
  const updateStatus = async (status: string) => {
    if (!waybill) return;
    setLoading(true);
    try {
      // Gọi API Patch mà chúng ta đã xây dựng hôm qua
      await axios.patch(`http://localhost:3000/tms/waybill/${waybill.id}`, {
        status: status,
        // Có thể thêm field deliveredTime: new Date() nếu Backend hỗ trợ
      });

      message.success(status === 'DELIVERED' ? 'Đã xác nhận GIAO THÀNH CÔNG' : 'Đã xác nhận HOÀN TRẢ');
      setRecentAction(status);
      
      // Reset để làm đơn tiếp theo
      setTimeout(() => {
        setWaybill(null);
        setKeyword('');
        // Focus lại vào ô input (Nếu cần xử lý DOM)
      }, 2000);

    } catch (error) {
      message.error('Lỗi cập nhật trạng thái');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ textAlign: 'center', color: '#1890ff' }}>
          <RocketOutlined /> Cập Nhật Giao Hàng
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 20 }}>
          Nhập mã vận đơn hoặc quét mã vạch
        </Text>

        {/* Ô TÌM KIẾM */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Input 
            size="large" 
            placeholder="VD: WB-177117..." 
            prefix={<ScanOutlined />} 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            Tìm
          </Button>
        </div>

        {/* KẾT QUẢ TÌM KIẾM */}
        {loading && !waybill && <div style={{textAlign:'center'}}><Spin /></div>}

        {waybill && !recentAction && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <Divider>Thông tin đơn hàng</Divider>
            <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
              <Row gutter={[10, 10]}>
                <Col span={24}><Text strong style={{fontSize: 16}}>{waybill.waybillCode}</Text></Col>
                <Col span={24}>
                   <Tag color={waybill.status === 'DELIVERED' ? 'green' : 'blue'}>{waybill.status}</Tag>
                </Col>
                <Col span={12}><Text type="secondary">Người nhận:</Text></Col>
                <Col span={12} style={{textAlign: 'right'}}><Text strong>{waybill.customerName}</Text></Col>
                
                <Col span={12}><Text type="secondary">Thu hộ (COD):</Text></Col>
                <Col span={12} style={{textAlign: 'right'}}>
                   <Text strong style={{color: '#cf1322', fontSize: 18}}>
                     {parseInt(waybill.codAmount || 0).toLocaleString()} đ
                   </Text>
                </Col>
                
                <Col span={24}><Text type="secondary">Địa chỉ:</Text> <Text>{waybill.address}</Text></Col>
              </Row>
            </div>

            {/* NÚT HÀNH ĐỘNG */}
            {waybill.status === 'DELIVERED' ? (
               <Result status="success" title="Đơn này đã giao xong rồi!" />
            ) : (
              <Row gutter={16}>
                <Col span={12}>
                  <Button 
                    block 
                    size="large" 
                    danger 
                    icon={<CloseCircleOutlined />} 
                    style={{ height: 50 }}
                    onClick={() => updateStatus('RETURNED')}
                  >
                    Giao Thất Bại
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    block 
                    type="primary" 
                    size="large" 
                    icon={<CheckCircleOutlined />} 
                    style={{ height: 50, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => updateStatus('DELIVERED')}
                  >
                    Giao Thành Công
                  </Button>
                </Col>
              </Row>
            )}
          </div>
        )}

        {/* THÔNG BÁO KẾT QUẢ SAU KHI BẤM */}
        {recentAction === 'DELIVERED' && (
           <Result status="success" title="Cập nhật thành công!" subTitle="Đã ghi nhận doanh thu COD." />
        )}
        {recentAction === 'RETURNED' && (
           <Result status="error" title="Đã báo hoàn!" subTitle="Vui lòng kiểm tra hàng trả về kho." />
        )}

      </Card>
    </div>
  );
};

export default PodPage;