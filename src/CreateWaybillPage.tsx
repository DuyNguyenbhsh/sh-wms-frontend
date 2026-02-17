import { useState, useEffect } from 'react';
import { 
  Table, Card, DatePicker, Select, Button, Tag, Space, 
  Modal, Form, Input, InputNumber, Row, Col, message, Badge, Divider 
} from 'antd';
import { 
  SearchOutlined, TruckOutlined, ExportOutlined, 
  PlusCircleOutlined, UserOutlined, EnvironmentOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { RangePicker } = DatePicker;

const CreateWaybillPage = () => {
  const [loading, setLoading] = useState(false);
  const [outboundOrders, setOutboundOrders] = useState<any[]>([]); // Dữ liệu phiếu xuất từ API
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  
  // Master Data
  const [providers, setProviders] = useState<any[]>([]); // ĐVVC
  const [form] = Form.useForm();

  // 1. Load dữ liệu khi vào trang
  useEffect(() => {
    fetchPendingOrders();
    fetchMasterData();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      // Gọi API TMS để lấy phiếu xuất
      const res = await axios.get('https://sh-wms-backend.onrender.com/tms/pending-outbound');
      setOutboundOrders(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchMasterData = async () => {
    try {
      // Gọi API MasterData để lấy danh sách ĐVVC
      const res = await axios.get('https://sh-wms-backend.onrender.com/master-data/providers');
      setProviders(res.data);
    } catch (error) { console.error(error); }
  };

  // 2. Mở Modal tạo đơn
  const handleOpenCreateModal = () => {
    if (selectedRowKeys.length === 0) return message.warning('Chọn phiếu xuất trước!');
    
    // Lấy phiếu đầu tiên được chọn
    const selectedOrder = outboundOrders.find(item => item.id === selectedRowKeys[0]);
    setCurrentOrder(selectedOrder);

    // Điền sẵn thông tin vào Form
    form.setFieldsValue({
        outboundOrderId: selectedOrder.id,
        orderCode: selectedOrder.code, // Chỉ để hiển thị
        customerName: selectedOrder.customer,
        phone: selectedOrder.phone,
        address: selectedOrder.address,
        codAmount: selectedOrder.amount, // Mặc định thu hộ = giá trị đơn
        weight: 1000,
        providerId: null // Để trống cho user chọn
    });
    setIsModalOpen(true);
  };

  // 3. Xử lý Lưu Vận Đơn
  const handleCreateWaybill = async (values: any) => {
    setLoading(true);
    try {
        // Chuẩn bị dữ liệu gửi về Backend TMS
        const payload = {
            outboundOrderId: currentOrder.id,
            waybillCode: values.waybillCode, // Nếu user nhập tay, hoặc để trống backend tự sinh
            providerId: values.providerId,
            codAmount: values.codAmount,
            weight: values.weight,
            shippingFee: values.shippingFee,
            // Các trường thông tin khách hàng chỉ để hiển thị, không cần lưu vào bảng Waybill nếu đã có OutboundOrder
        };

        await axios.post('https://sh-wms-backend.onrender.com/tms/waybill', payload);
        
        message.success(`Tạo vận đơn thành công cho phiếu ${currentOrder.code}`);
        setIsModalOpen(false);
        setSelectedRowKeys([]);
        fetchPendingOrders(); // Tải lại danh sách
    } catch (error) {
        message.error('Lỗi khi tạo vận đơn');
    }
    setLoading(false);
  };

  const columns = [
    {
      title: 'Trạng thái', dataIndex: 'status', width: 100, align: 'center' as const,
      render: () => <Tag color="orange">Chờ tạo</Tag>
    },
    { title: 'Số phiếu', dataIndex: 'code', render: (t:string) => <b>{t}</b> },
    { title: 'Ngày xuất', dataIndex: 'date' },
    { 
        title: 'Khách hàng', dataIndex: 'customer',
        render: (text: string, record: any) => (
            <div>
                <div><UserOutlined /> {text}</div>
                <div style={{fontSize: 12, color: '#888'}}>{record.phone}</div>
            </div>
        )
    },
    { title: 'Giá trị', dataIndex: 'amount', align: 'right' as const, render: (val: number) => val?.toLocaleString('vi-VN') + ' đ' },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* FILTER BAR GIỮ NGUYÊN */}
      <Card bordered={false} bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}><RangePicker style={{ width: '100%' }} /></Col>
          <Col span={6}><Input placeholder="Tìm theo số phiếu / Khách hàng..." prefix={<SearchOutlined />} /></Col>
          <Col span={12} style={{textAlign: 'right'}}>
             <Button type="primary" icon={<SearchOutlined />}>Tìm kiếm</Button>
          </Col>
        </Row>
      </Card>

      {/* BẢNG DỮ LIỆU */}
      <Card 
        title={<Space><TruckOutlined /> DANH SÁCH PHIẾU CHỜ TẠO VẬN ĐƠN <Badge count={outboundOrders.length} style={{backgroundColor: '#52c41a'}} /></Space>}
        extra={
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleOpenCreateModal} disabled={selectedRowKeys.length === 0}>
                Tạo Vận Đơn
            </Button>
        }
      >
        <Table 
            rowSelection={{
                type: 'radio', // Tạm thời làm từng đơn 1 cho đơn giản logic
                onChange: (keys) => setSelectedRowKeys(keys),
                selectedRowKeys: selectedRowKeys,
            }}
            columns={columns} 
            dataSource={outboundOrders} 
            rowKey="id"
        />
      </Card>

      {/* MODAL TẠO VẬN ĐƠN */}
      <Modal title="Tạo Vận Đơn Mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={800}>
        <Form form={form} layout="vertical" onFinish={handleCreateWaybill}>
            <Row gutter={24}>
                {/* Cột trái: Thông tin đơn hàng (Read only) */}
                <Col span={12}>
                    <Divider orientation="left">Thông tin Phiếu xuất</Divider>
                    <Form.Item name="orderCode" label="Số phiếu"><Input disabled style={{fontWeight: 'bold', color: 'black'}} /></Form.Item>
                    <Form.Item name="customerName" label="Người nhận"><Input disabled /></Form.Item>
                    <Form.Item name="address" label="Địa chỉ giao"><Input.TextArea disabled rows={2} /></Form.Item>
                </Col>

                {/* Cột phải: Thông tin Vận chuyển (Nhập liệu) */}
                <Col span={12}>
                    <Divider orientation="left" style={{borderColor: '#1890ff', color: '#1890ff'}}>Thiết lập Vận chuyển</Divider>
                    
                    <Form.Item name="providerId" label="Đơn vị vận chuyển" rules={[{required: true, message: 'Vui lòng chọn ĐVVC'}]}>
                        <Select placeholder="-- Chọn đối tác --">
                            {providers.map(p => (
                                <Select.Option key={p.id} value={p.id}>
                                    <Space>{p.code} - {p.name}</Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="weight" label="Trọng lượng (gr)"><InputNumber style={{width: '100%'}} /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="codAmount" label="Tiền thu hộ (COD)"><InputNumber style={{width: '100%'}} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item name="waybillCode" label="Mã vận đơn (Tracking Code)">
                        <Input placeholder="Để trống nếu muốn tự sinh hoặc nhập mã từ App ĐVVC" />
                    </Form.Item>
                </Col>
            </Row>

            <div style={{textAlign: 'right', marginTop: 10}}>
                <Button onClick={() => setIsModalOpen(false)} style={{marginRight: 10}}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>Xác nhận Tạo</Button>
            </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateWaybillPage;