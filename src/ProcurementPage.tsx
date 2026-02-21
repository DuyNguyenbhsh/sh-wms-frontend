import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Typography, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axiosClient from './api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ProcurementPage = () => {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 1. GỌI API LẤY DANH SÁCH ĐƠN ĐẶT HÀNG
  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/procurement/po');
      setPos(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách PO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  // 2. GỬI API TẠO ĐƠN ĐẶT HÀNG MỚI
  const handleCreatePO = async (values: any) => {
    try {
      await axiosClient.post('/procurement/po', values);
      message.success('Tạo Đơn Đặt Hàng thành công!');
      setIsModalVisible(false);
      form.resetFields();
      fetchPOs(); // Tải lại bảng
    } catch (error) {
      message.error('Có lỗi xảy ra khi tạo PO');
    }
  };

  // --- CẤU HÌNH BẢNG HIỂN THỊ DÀNH CHO LAPTOP ---
  const columns = [
    { 
      title: 'Mã PO', 
      dataIndex: 'po_number', 
      key: 'po_number',
      render: (text: string) => <Text strong style={{ color: '#096dd9' }}>{text}</Text>
    },
    { title: 'Nhà Cung Cấp', dataIndex: 'vendor_id', key: 'vendor_id' },
    { 
      title: 'Tổng Tiền', 
      dataIndex: 'total_amount', 
      key: 'total_amount',
      align: 'right' as const,
      render: (val: number) => <Text strong style={{ color: '#cf1322' }}>{Number(val).toLocaleString()} VNĐ</Text>
    },
    { 
      title: 'Ngày Tạo', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm')
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'status', 
      key: 'status',
      align: 'center' as const,
      render: (status: string) => {
        let color = 'default';
        if (status === 'APPROVED') color = 'processing';
        if (status === 'RECEIVING') color = 'warning';
        if (status === 'COMPLETED') color = 'success';
        return <Tag color={color}>{status}</Tag>;
      }
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><ShoppingCartOutlined /> Quản Lý Đơn Mua Hàng (PO)</Title>
          <Text type="secondary">Phân hệ Procurement - Tạo và theo dõi đơn đặt hàng với NCC</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Tạo Đơn Hàng Mới
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={pos} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* MODAL TẠO PO MỚI */}
      <Modal
        title={<Title level={4}>Tạo Đơn Đặt Hàng Mới</Title>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Xác nhận Tạo PO"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePO}>
          <Form.Item 
            name="vendor_id" 
            label="Nhà Cung Cấp" 
            rules={[{ required: true, message: 'Vui lòng chọn NCC' }]}
          >
            <Select placeholder="Chọn nhà cung cấp...">
              <Option value="NCC_NhatTin">Nhất Tín Logistics (Cung cấp VPP/Thiết bị kho)</Option>
              <Option value="NCC_Intel">Intel Vietnam</Option>
              <Option value="NCC_Asus">Asus Vietnam</Option>
              <Option value="NCC_FPT">FPT Synnex</Option>
            </Select>
          </Form.Item>

          <Card size="small" title="Danh sách sản phẩm" bordered style={{ background: '#fafafa' }}>
            <Form.List name="lines" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        rules={[{ required: true, message: 'Thiếu Mã SP' }]}
                        style={{ width: 300 }}
                      >
                        <Select placeholder="Chọn Sản phẩm...">
                          <Option value="CPU_CORE_I5">CPU Core i5 13400F</Option>
                          <Option value="CPU_CORE_I9">CPU Core i9 14900K</Option>
                          <Option value="MAIN_H310">Mainboard H310 Asus</Option>
                          <Option value="VGA_RTX4060">VGA RTX 4060 8GB</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'order_qty']}
                        rules={[{ required: true, message: 'Thiếu SL' }]}
                      >
                        <InputNumber placeholder="Số lượng" min={1} style={{ width: 120 }} />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'unit_price']}
                        rules={[{ required: true, message: 'Thiếu Đơn giá' }]}
                      >
                        <InputNumber 
                          placeholder="Đơn giá (VNĐ)" 
                          min={0} 
                          step={100000}
                          style={{ width: 150 }} 
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>

                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: 18 }} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Thêm dòng sản phẩm
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcurementPage;